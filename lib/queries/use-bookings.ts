import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomerBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
} from "@/lib/customer/api";
import { QUERY_KEYS } from "./query-keys";
import {
  invalidateBookingQueries,
  invalidateNotificationQueries,
} from "./query-invalidation";
import type { CustomerBooking, BookingStatus } from "@/types/customer";

// QUERIES
/**
 * Bookings list with filters
 * Bookings can change status frequently, but list doesn't need to be real-time
 */
export function useBookings(filters?: {
  status?: BookingStatus;
  limit?: number;
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "list", filters || {}],
    queryFn: async () => {
      const data = await getCustomerBookings(filters);
      return {
        bookings: Array.isArray(data?.bookings) ? data.bookings : [],
        total: data?.total || 0,
      };
    },
    refetchOnWindowFocus: true,
    staleTime: 2 * 60 * 1000, // 2 minutes - bookings can change status
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

/**
 * Single booking details
 * Individual booking details change less frequently
 */
export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "detail", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
    staleTime: 5 * 60 * 1000, // 5 minutes - booking details change less often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// MUTATIONS
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: number;
      reason?: string;
    }) => cancelBooking(bookingId, reason),

    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });

      const previousBookings = queryClient.getQueryData([
        QUERY_KEYS.BOOKINGS,
        "list",
      ]);

      // Optimistically update to cancelled
      queryClient.setQueryData([QUERY_KEYS.BOOKINGS, "list"], (old: any) => {
        if (!old?.bookings) return old;
        return {
          ...old,
          bookings: old.bookings.map((b: CustomerBooking) =>
            b.id === bookingId ? { ...b, status: "cancelled" } : b,
          ),
        };
      });

      return { previousBookings };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.BOOKINGS, "list"],
        context?.previousBookings,
      );
      toast.error("Failed to cancel booking");
    },

    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Booking cancelled successfully");
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      newData,
    }: {
      bookingId: number;
      newData: { newSlotId: number; newDate?: string };
    }) => rescheduleBooking(bookingId, newData),

    onSuccess: () => {
      invalidateBookingQueries(queryClient);
      invalidateNotificationQueries(queryClient);
      toast.success("Booking rescheduled successfully");
    },

    onError: () => {
      toast.error("Failed to reschedule booking");
    },
  });
}
