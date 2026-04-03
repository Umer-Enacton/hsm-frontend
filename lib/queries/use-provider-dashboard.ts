import { useQuery } from "@tanstack/react-query";
import { getProviderBusiness, getProviderBookings } from "@/lib/provider/api";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";
import type { Business, ProviderDashboardStats } from "@/types/provider";
import type { ProviderBooking } from "@/types/provider";

// ============================================================================
// QUERIES - With proper caching for better UX
// ============================================================================

/**
 * Get provider business profile
 * Business data changes rarely (only when provider updates profile)
 */
export function useProviderBusiness(userId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BUSINESS, "detail", userId],
    queryFn: () => getProviderBusiness(userId || 0),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30 minutes - business rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    retry: false,
  });
}

/**
 * Get provider's business services
 * Services change moderately (when provider adds/edits services)
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
    staleTime: 10 * 60 * 1000, // 10 minutes - services change moderately
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * Get provider bookings for dashboard
 * Bookings can change status frequently, but list doesn't need real-time updates
 */
export function useProviderDashboardBookings() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "list", {}],
    queryFn: async () => {
      const data = await getProviderBookings(undefined);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - bookings can change status
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  });
}

/**
 * Get comprehensive dashboard stats
 * This is DERIVED data from bookings/services - no separate API call needed
 * Uses the already-cached bookings and services data
 */
export function useProviderDashboardStats(businessId?: number, business?: Business | null) {
  const { data: bookings = [] } = useProviderDashboardBookings();
  const { data: services = [] } = useProviderServices(businessId);

  // Memoized stats calculation (only recalculates when data actually changes)
  const stats: ProviderDashboardStats = useMemo(() => {
    // Helper function to get booking date safely
    const getBookingDate = (b: ProviderBooking) => {
      const dateStr = b.date || b.bookingDate || "";
      return dateStr ? new Date(dateStr) : new Date(0);
    };

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
    const cancelledBookings = bookings.filter((b: ProviderBooking) => b.status === "cancelled").length;

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
      cancelledBookings,
      totalEarnings: monthlyRevenue,
      averageRating: business?.rating || 0,
      activeServices,
    };
  }, [bookings, services, business]);

  return {
    data: stats,
    isLoading: false, // Never shows loading since it's derived data
  };
}

// Fix: Add useMemo import if not present
import { useMemo } from "react";
