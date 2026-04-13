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
import {
  invalidateBookingQueries,
  invalidateNotificationQueries,
} from "./query-invalidation";
import type { ProviderBooking } from "@/types/provider";
import { API_ENDPOINTS } from "@/lib/api";

// ============================================================================
// QUERIES - With proper caching to stop constant refetching
// ============================================================================

/**
 * Get all provider bookings with optional status filter and pagination
 * Bookings status can change, but list doesn't need real-time updates
 */
export function useProviderBookings(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { page = 1, limit = 10 } = filters || {};

  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "list", filters || {}],
    queryFn: async () => {
      const data = await getProviderBookings(filters?.status, page, limit);
      return {
        bookings: data.bookings || [],
        pagination: data.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    },
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    retry: false, // Fail immediately on error
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
      const data = await getProviderBookings();
      const bookings = data.bookings || data || [];
      return (Array.isArray(bookings) ? bookings : []).find((b: ProviderBooking) => b.id === bookingId) || null;
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
      // Invalidate ALL booking queries (customer, provider, admin)
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Booking accepted successfully");
    },

    onError: (error: any) => {
      console.error("Error accepting booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        invalidateBookingQueries(queryClient);
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
      // Invalidate ALL booking queries
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Booking rejected successfully");
    },

    onError: (error: any) => {
      console.error("Error rejecting booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        // Refresh data to show current state
        invalidateBookingQueries(queryClient);
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
      // Invalidate ALL booking queries
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Booking marked as complete successfully");
    },

    onError: (error: any) => {
      console.error("Error completing booking:", error);

      // Check if booking is already in a terminal state
      if (error.message?.includes("Current status:")) {
        invalidateBookingQueries(queryClient);
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
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
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
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
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
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Photos uploaded successfully");
    },
    onError: (error: any) => {
      console.error("Error uploading photos:", error);
      toast.error(error.message || "Failed to upload photos");
    },
  });
}

/**
 * Get available staff for a booking
 */
export function useAvailableStaff(params?: {
  slotId?: number;
  date?: string;
}) {
  const api = require("@/lib/api").api;

  return useQuery({
    queryKey: ["available-staff", params],
    queryFn: async () => {
      // Construct query string manually since api.get doesn't handle params option
      const queryParams = new URLSearchParams();
      if (params?.slotId) queryParams.append('slotId', params.slotId.toString());
      if (params?.date) queryParams.append('date', params.date);
      const queryString = queryParams.toString();

      const response = await api.get(
        queryString ? `${API_ENDPOINTS.BOOKING_AVAILABLE_STAFF}?${queryString}` : API_ENDPOINTS.BOOKING_AVAILABLE_STAFF
      );
      return response.data || [];
    },
    enabled: !!(params?.slotId && params?.date),
    staleTime: 2 * 60 * 1000, // 2 minutes - staff availability can change
    retry: false,
  });
}

/**
 * Assign booking to staff
 */
export function useAssignBookingToStaff() {
  const queryClient = useQueryClient();
  const api = require("@/lib/api").api;

  return useMutation({
    mutationFn: ({
      bookingId,
      staffId,
      earningType,
      commissionPercent,
      fixedAmount,
    }: {
      bookingId: number;
      staffId: number;
      earningType: "commission" | "fixed";
      commissionPercent?: number;
      fixedAmount?: number;
    }) =>
      api.post(API_ENDPOINTS.BOOKING_ASSIGN_STAFF(bookingId), {
        staffId,
        earningType,
        commissionPercent: earningType === "commission" ? commissionPercent : undefined,
        fixedAmount: earningType === "fixed" ? fixedAmount : undefined,
      }),
    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Staff assigned successfully");
    },
    onError: (error: any) => {
      console.error("Error assigning staff:", error);
      toast.error(error.message || "Failed to assign staff");
    },
  });
}

/**
 * Unassign booking from staff
 */
export function useUnassignBookingFromStaff() {
  const queryClient = useQueryClient();
  const api = require("@/lib/api").api;

  return useMutation({
    mutationFn: (bookingId: number) =>
      api.post(API_ENDPOINTS.BOOKING_UNASSIGN_STAFF(bookingId)),
    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      toast.success("Staff unassigned successfully");
    },
    onError: (error: any) => {
      console.error("Error unassigning staff:", error);
      toast.error(error.message || "Failed to unassign staff");
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
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    missed: bookings.filter((b) => b.status === "missed").length,
  };
}
