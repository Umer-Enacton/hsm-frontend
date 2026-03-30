import { useQuery } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queries/query-keys";

interface ProviderRevenueStats {
  totalEarnings: number;
  pendingPayouts: number;
  paidPayouts: number;
  totalBookings: number;
  completedBookings: number;
  breakdown: {
    period: string;
    earnings: number;
    bookings: number;
  }[];
}

/**
 * Hook to fetch provider's revenue/earnings statistics
 */
export function useProviderRevenueStats() {
  return useQuery<ProviderRevenueStats>({
    queryKey: [QUERY_KEYS.PROVIDER_REVENUE, "stats"],
    queryFn: async () => {
      const response = await api.get<ProviderRevenueStats>(API_ENDPOINTS.PROVIDER_REVENUE);
      return response;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
