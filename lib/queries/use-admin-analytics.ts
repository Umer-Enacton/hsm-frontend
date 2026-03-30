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

export function useAdminAnalytics(period: PeriodType = "7d"): AdminAnalyticsResult {
  // Revenue data
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    refetch: refetchRevenue,
  } = useQuery<RevenueResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "revenue", period],
    queryFn: () => api.get<RevenueResponse>(`/admin/analytics/revenue?period=${period}`),
    staleTime: 1000 * 60, // 1 minute
  });

  // Category data
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery<CategoryResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "categories", period],
    queryFn: () => api.get<CategoryResponse>(`/admin/analytics/categories?period=${period}`),
    staleTime: 1000 * 60,
  });

  // Status data
  const { data: statusData, isLoading: isLoadingStatus } = useQuery<StatusResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "status", period],
    queryFn: () => api.get<StatusResponse>(`/admin/analytics/status?period=${period}`),
    staleTime: 1000 * 60,
  });

  // Providers data
  const { data: providersData, isLoading: isLoadingProviders } = useQuery<ProvidersResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "providers", period],
    queryFn: () => api.get<ProvidersResponse>(`/admin/analytics/providers?period=${period}`),
    staleTime: 1000 * 60,
  });

  // Payment status data
  const { data: paymentStatusData, isLoading: isLoadingPaymentStatus } = useQuery<PaymentStatusResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "payment-status", period],
    queryFn: () => api.get<PaymentStatusResponse>(`/admin/analytics/payment-status?period=${period}`),
    staleTime: 1000 * 60,
  });

  // Average order value data
  const { data: avgOrderValueData, isLoading: isLoadingAvgOrderValue } = useQuery<AverageOrderValueResponse>({
    queryKey: [QUERY_KEYS.ADMIN_ANALYTICS, "average-order-value", period],
    queryFn: () => api.get<AverageOrderValueResponse>(`/admin/analytics/average-order-value?period=${period}`),
    staleTime: 1000 * 60,
  });

  const isLoading =
    isLoadingRevenue ||
    isLoadingCategory ||
    isLoadingStatus ||
    isLoadingProviders ||
    isLoadingPaymentStatus ||
    isLoadingAvgOrderValue;

  const isRefreshing = false; // Could be enhanced with isFetching from queries

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
