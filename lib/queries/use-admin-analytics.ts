import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";

type PeriodType = "7d" | "30d" | "6m" | "12m" | "all";

interface RevenueResponse {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    platformFees: number;
    providerPayouts: number;
    completionRate: string;
  };
  chartData: Array<{
    date: string;
    bookings: number;
    revenue: number;
    completed: number;
    cumulativeRevenue: number;
  }>;
}

interface CategoryResponse {
  period: string;
  categories: Array<{
    categoryId: number;
    categoryName: string;
    bookingCount: number;
    totalRevenue: number;
    platformFees: number;
    percentage: string;
  }>;
  totalBookings: number;
  totalRevenue: number;
  totalPlatformFees: number;
}

interface StatusResponse {
  period: string;
  totalBookings: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    revenue: number;
    platformFees: number;
    percentage: string;
    fill: string;
  }>;
  totalRevenue: number;
  totalPlatformFees: number;
}

interface ProvidersResponse {
  period: string;
  providers: Array<{
    providerId: number;
    providerName: string;
    businessName: string;
    bookingCount: number;
    totalRevenue: number;
    platformFees: number;
    percentage: string;
  }>;
  totalBookings: number;
  totalRevenue: number;
  totalPlatformFees: number;
}

interface PaymentStatusResponse {
  period: string;
  totalBookings: number;
  paymentStatuses: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  totalRevenue: number;
}

interface AverageOrderValueResponse {
  period: string;
  averageOrderValue: number;
  totalOrders: number;
}

interface AdminAnalyticsResult {
  revenueData: RevenueResponse | undefined;
  categoryData: CategoryResponse | undefined;
  statusData: StatusResponse | undefined;
  providersData: ProvidersResponse | undefined;
  paymentStatusData: PaymentStatusResponse | undefined;
  avgOrderValueData: AverageOrderValueResponse | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Admin analytics queries
 * Historical analytics data - changes moderately as bookings complete
 * Longer cache times since historical data doesn't change
 */
export function useAdminAnalytics(period: PeriodType = "7d"): AdminAnalyticsResult {
  // Revenue data - historical data rarely changes
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    isFetching: isFetchingRevenue,
    refetch: refetchRevenue,
  } = useQuery<RevenueResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "revenue", period],
    queryFn: () => api.get<RevenueResponse>(`/admin/analytics/revenue?period=${period}`),
    staleTime: 15 * 60 * 1000, // 15 minutes - historical data
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });

  // Category data
  const { data: categoryData, isLoading: isLoadingCategory, isFetching: isFetchingCategory } = useQuery<CategoryResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "categories", period],
    queryFn: () => api.get<CategoryResponse>(`/admin/analytics/categories?period=${period}`),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Status data - can change more frequently as bookings update
  const { data: statusData, isLoading: isLoadingStatus, isFetching: isFetchingStatus } = useQuery<StatusResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "status", period],
    queryFn: () => api.get<StatusResponse>(`/admin/analytics/status?period=${period}`),
    staleTime: 5 * 60 * 1000, // 5 minutes - status updates more frequently
    gcTime: 30 * 60 * 1000,
  });

  // Providers data
  const { data: providersData, isLoading: isLoadingProviders, isFetching: isFetchingProviders } = useQuery<ProvidersResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "providers", period],
    queryFn: () => api.get<ProvidersResponse>(`/admin/analytics/providers?period=${period}`),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Payment status data
  const { data: paymentStatusData, isLoading: isLoadingPaymentStatus, isFetching: isFetchingPaymentStatus } = useQuery<PaymentStatusResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "payment-status", period],
    queryFn: () => api.get<PaymentStatusResponse>(`/admin/analytics/payment-status?period=${period}`),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 45 * 60 * 1000,
  });

  // Average order value data
  const { data: avgOrderValueData, isLoading: isLoadingAvgOrderValue, isFetching: isFetchingAvgOrderValue } = useQuery<AverageOrderValueResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "average-order-value", period],
    queryFn: () => api.get<AverageOrderValueResponse>(`/admin/analytics/average-order-value?period=${period}`),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000,
  });

  const isLoading =
    isLoadingRevenue ||
    isLoadingCategory ||
    isLoadingStatus ||
    isLoadingProviders ||
    isLoadingPaymentStatus ||
    isLoadingAvgOrderValue;

  const isRefreshing =
    isFetchingRevenue ||
    isFetchingCategory ||
    isFetchingStatus ||
    isFetchingProviders ||
    isFetchingPaymentStatus ||
    isFetchingAvgOrderValue;

  const refetch = () => {
    refetchRevenue();
  };

  return {
    revenueData,
    categoryData,
    statusData,
    providersData,
    paymentStatusData,
    avgOrderValueData,
    isLoading,
    isRefreshing,
    refetch,
  };
}
