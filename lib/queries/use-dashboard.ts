import { useQuery } from "@tanstack/react-query";
import { getCustomerBookings, getServices } from "@/lib/customer/api";
import { QUERY_KEYS } from "./query-keys";


/**
 * Recent bookings on dashboard
 * Changes when bookings are made/completed
 */
export function useRecentBookings() {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "recent"],
    queryFn: async () => {
      const data = await getCustomerBookings({ limit: 3 });
      return Array.isArray(data?.bookings) ? data.bookings.slice(0, 3) : [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - bookings change moderately
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  });
}

/**
 * Booking stats (total, confirmed, completed, cancelled)
 * Changes when booking status changes
 */
export function useBookingStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, "stats"],
    queryFn: async () => {
      const data = await getCustomerBookings({ limit: 1000 });
      const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

      return {
        totalBookings: data?.pagination?.total || bookings.length,
        confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
        completedBookings: bookings.filter((b) => b.status === "completed").length,
        cancelledBookings: bookings.filter((b) => b.status === "cancelled").length,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats can change quickly
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

/**
 * Featured services list
 * Changes rarely (only when providers add new services)
 */
export function useFeaturedServices() {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES, "featured"],
    queryFn: async () => {
      const data = await getServices();
      const services = Array.isArray(data?.data) ? data.data : [];

      // Show all services, sorted by rating (0 rating is ok)
      return services
        .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
        .slice(0, 6);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - services list rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}
