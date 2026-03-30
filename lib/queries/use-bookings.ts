import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomerBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
} from "@/lib/customer/api";
import { QUERY_KEYS } from "./query-keys";
import type { CustomerBooking, BookingStatus } from "@/types/customer";

// QUERIES
export function useBookings(filters?: { status?: BookingStatus; limit?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "list", filters || {}],
    queryFn: async () => {
      const data = await getCustomerBookings(filters);
      return {
        bookings: Array.isArray(data?.bookings) ? data.bookings : [],
        total: data?.total || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "detail", bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// MUTATIONS
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      cancelBooking(bookingId, reason),

    onMutate: async ({ bookingId }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });

      const previousBookings = queryClient.getQueryData([QUERY_KEYS.BOOKINGS, "list"]);

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
      queryClient.setQueryData([QUERY_KEYS.BOOKINGS, "list"], context?.previousBookings);
      toast.error("Failed to cancel booking");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
      toast.success("Booking rescheduled successfully");
    },

    onError: () => {
      toast.error("Failed to reschedule booking");
    },
  });
}
