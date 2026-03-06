import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
} from "@/lib/provider/api";
import { queryKeys } from "./query-keys";
import type { ProviderBooking } from "@/types/provider";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all provider bookings with optional status filter
 */
export function useProviderBookings(filters?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.provider.bookings.list(filters || {}),
    queryFn: async () => {
      const data = await getProviderBookings(filters?.status);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Get a single booking by ID
 */
export function useProviderBooking(bookingId: number) {
  return useQuery({
    queryKey: queryKeys.provider.bookings.detail(bookingId),
    queryFn: async () => {
      // For now, fetch all and filter (backend doesn't have single booking endpoint)
      const bookings = await getProviderBookings();
      return bookings.find((b: ProviderBooking) => b.id === bookingId) || null;
    },
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.bookings.all });
      toast.success("Booking accepted successfully");
    },

    onError: (error: any) => {
      console.error("Error accepting booking:", error);
      toast.error(error.message || "Failed to accept booking");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.bookings.all });
      toast.success("Booking rejected");
    },

    onError: (error: any) => {
      console.error("Error rejecting booking:", error);
      toast.error(error.message || "Failed to reject booking");
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
      queryClient.invalidateQueries({ queryKey: queryKeys.provider.bookings.all });
      toast.success("Booking marked as complete");
    },

    onError: (error: any) => {
      console.error("Error completing booking:", error);
      toast.error(error.message || "Failed to complete booking");
    },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Compute booking stats from bookings array
 */
export function useBookingStats(bookings: ProviderBooking[]) {
  return {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    reschedulePending: bookings.filter((b) => b.status === "reschedule_pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter(
      (b) => b.status === "cancelled" || b.status === "rejected"
    ).length,
  };
}
