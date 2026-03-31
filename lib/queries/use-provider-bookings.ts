import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
  initiateCompletion,
  verifyCompletionOTP,
  resendCompletionOTP,
  uploadCompletionPhotos,
} from "@/lib/provider/api";
import { QUERY_KEYS } from "./query-keys";
import type { ProviderBooking } from "@/types/provider";

// ============================================================================
// QUERIES - With proper caching to stop constant refetching
// ============================================================================

/**
 * Get all provider bookings with optional status filter
 * Bookings status can change, but list doesn't need real-time updates
 */
export function useProviderBookings(filters?: { status?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "list", filters || {}],
    queryFn: async () => {
      const data = await getProviderBookings(filters?.status);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - was 30 sec, way too short!
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  });
}

/**
 * Get a single booking by ID
 * Individual booking details change less frequently
 */
export function useProviderBooking(bookingId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "detail", bookingId],
    queryFn: async () => {
      // For now, fetch all and filter (backend doesn't have single booking endpoint)
      const bookings = await getProviderBookings();
      return bookings.find((b: ProviderBooking) => b.id === bookingId) || null;
    },
    enabled: !!bookingId,
    staleTime: 10 * 60 * 1000, // 10 minutes - booking details change rarely
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Accept a pending booking
 */
export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) => acceptBooking(bookingId),

    onSuccess: () => {
      // Invalidate all provider booking queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      toast.success("Booking accepted successfully");
    },

    onError: (error: any) => {
      console.error("Error accepting booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
        });
        toast.error(
          error.message ||
            "This booking has already been processed. Refreshing...",
        );
      } else {
        toast.error(error.message || "Failed to accept booking");
      }
    },
  });
}

/**
 * Reject a pending booking
 */
export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) => rejectBooking(bookingId),

    onSuccess: () => {
      // Invalidate all provider booking queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      toast.success("Booking rejected successfully");
    },

    onError: (error: any) => {
      console.error("Error rejecting booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        // Refresh data to show current state
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
        });
        toast.error(
          error.message ||
            "This booking has already been processed. Refreshing...",
        );
      } else {
        toast.error(error.message || "Failed to reject booking");
      }
    },
  });
}

/**
 * Complete a confirmed booking
 */
export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) => completeBooking(bookingId),

    onSuccess: () => {
      // Invalidate all provider booking queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      toast.success("Booking marked as complete successfully");
    },

    onError: (error: any) => {
      console.error("Error completing booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
        });
        toast.error(
          error.message ||
            "This booking has already been processed. Refreshing...",
        );
      } else {
        toast.error(error.message || "Failed to complete booking");
      }
    },
  });
}

/**
 * Initiate completion - Send OTP to customer
 */
export function useInitiateCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: number;
      data?: {
        beforePhotoUrl?: string;
        afterPhotoUrl?: string;
        completionNotes?: string;
      };
    }) => initiateCompletion(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      toast.success("OTP sent to customer's email");
    },
    onError: (error: any) => {
      console.error("Error initiating completion:", error);
      toast.error(error.message || "Failed to send OTP");
    },
  });
}

/**
 * Verify OTP and complete booking
 */
export function useVerifyCompletionOTP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, otp }: { bookingId: number; otp: string }) =>
      verifyCompletionOTP(bookingId, otp),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      if (data.success) {
        toast.success("Booking completed successfully!");
      } else {
        toast.error(data.message || "Failed to verify OTP");
      }
    },
    onError: (error: any) => {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Failed to verify OTP");
    },
  });
}

/**
 * Resend completion OTP
 */
export function useResendCompletionOTP() {
  return useMutation({
    mutationFn: (bookingId: number) => resendCompletionOTP(bookingId),
    onSuccess: () => {
      toast.success("New OTP sent to customer's email");
    },
    onError: (error: any) => {
      console.error("Error resending OTP:", error);
      toast.error(error.message || "Failed to resend OTP");
    },
  });
}

/**
 * Upload completion photos
 */
export function useUploadCompletionPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      beforePhotoUrl,
      afterPhotoUrl,
    }: {
      bookingId: number;
      beforePhotoUrl?: string;
      afterPhotoUrl?: string;
    }) => uploadCompletionPhotos(bookingId, beforePhotoUrl, afterPhotoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
      });
      toast.success("Photos uploaded successfully");
    },
    onError: (error: any) => {
      console.error("Error uploading photos:", error);
      toast.error(error.message || "Failed to upload photos");
    },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Compute booking stats from bookings array
 * This is a pure utility function - no caching needed
 */
export function useBookingStats(bookings: ProviderBooking[]) {
  return {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    reschedulePending: bookings.filter((b) => b.status === "reschedule_pending")
      .length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };
}
