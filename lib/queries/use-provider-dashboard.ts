import { useQuery } from "@tanstack/react-query";
import { getProviderBusiness, getProviderBookings } from "@/lib/provider/api";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";
import type { Business, ProviderDashboardStats } from "@/types/provider";
import type { ProviderBooking } from "@/types/provider";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get provider business profile
 */
export function useProviderBusiness(userId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BUSINESS, "detail", userId],
    queryFn: () => getProviderBusiness(userId || 0),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Get provider's business services
 */
export function useProviderServices(businessId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICES, businessId || 0],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get(`/services/business/${businessId}`);
      return Array.isArray(response) ? response : (response?.services || []);
    },
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get provider bookings for dashboard
 */
export function useProviderDashboardBookings() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "list", {}],
    queryFn: async () => {
      const data = await getProviderBookings(undefined);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get comprehensive dashboard stats
 */
export function useProviderDashboardStats(businessId?: number) {
  const { data: bookings = [] } = useProviderDashboardBookings();
  const { data: services = [] } = useProviderServices(businessId);

  // Helper function to get booking date safely
  const getBookingDate = (b: ProviderBooking) => {
    const dateStr = b.date || b.bookingDate || "";
    return dateStr ? new Date(dateStr) : new Date(0);
  };

  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_DASHBOARD, "stats"],
    queryFn: (): ProviderDashboardStats => {
      // Calculate today's bookings
      const today = new Date().toDateString();
      const todayBookings = bookings.filter((b: ProviderBooking) => {
        const bookingDate = getBookingDate(b).toDateString();
        return bookingDate === today;
      }).length;

      // Calculate status counts
      const pendingBookings = bookings.filter((b: ProviderBooking) => b.status === "pending").length;
      const confirmedBookings = bookings.filter((b: ProviderBooking) => b.status === "confirmed").length;
      const completedBookings = bookings.filter((b: ProviderBooking) => b.status === "completed").length;

      // Calculate monthly revenue
      const now = new Date();
      const monthlyRevenue = bookings
        .filter((b: ProviderBooking) => {
          const isCompleted = b.status === "completed";
          const bookingDate = getBookingDate(b);
          const isThisMonth =
            bookingDate.getMonth() === now.getMonth() &&
            bookingDate.getFullYear() === now.getFullYear();
          return isCompleted && isThisMonth;
        })
        .reduce((sum: number, b: ProviderBooking) => sum + (b.price || 0), 0);

      // Calculate active services
      const activeServices = (Array.isArray(services) ? services : []).filter((s: any) => s.isActive || s.is_active).length;

      return {
        totalBookings: bookings.length,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalEarnings: monthlyRevenue,
        averageRating: 0, // Will be enhanced with business data
        activeServices,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
