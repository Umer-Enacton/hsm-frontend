import { useQuery } from "@tanstack/react-query";
import { getCustomerBookings, getServices } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { CustomerBooking, CustomerService } from "@/types/customer";

export function useRecentBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.recent(),
    queryFn: async () => {
      const data = await getCustomerBookings({ limit: 3 });
      return Array.isArray(data?.bookings) ? data.bookings.slice(0, 3) : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBookingStats() {
  return useQuery({
    queryKey: queryKeys.bookings.stats(),
    queryFn: async () => {
      const data = await getCustomerBookings();
      const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

      return {
        totalBookings: data?.total || 0,
        pendingBookings: bookings.filter((b) => b.status === "pending").length,
        completedBookings: bookings.filter((b) => b.status === "completed").length,
      };
    },
    staleTime: 60 * 1000, // 1 minute - stats change frequently
  });
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: queryKeys.services.featured(),
    queryFn: async () => {
      const data = await getServices();
      const services = Array.isArray(data?.data) ? data.data : [];

      return services
        .filter((s) => s.provider?.rating)
        .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
        .slice(0, 6);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
