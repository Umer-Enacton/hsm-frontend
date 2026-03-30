'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

type PeriodType = '7d' | '30d' | '6m' | '12m' | 'all';

interface RevenueResponse {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalCompleted: number;
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

interface ServicesResponse {
  period: string;
  services: Array<{
    serviceId: number;
    serviceName: string;
    bookingCount: number;
    totalRevenue: number;
    completedCount: number;
    avgRating: string;
    percentage: string;
  }>;
  totalBookings: number;
  totalRevenue: number;
}

interface StatusResponse {
  period: string;
  totalBookings: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    revenue: number;
    percentage: string;
    fill: string;
  }>;
  totalRevenue: number;
}

export function useProviderAnalytics(period: PeriodType = '7d') {
  const revenueQuery = useQuery<RevenueResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'revenue', period],
    queryFn: () =>
      api.get<RevenueResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_REVENUE}?period=${period}`,
      ),
    staleTime: 1000 * 60, // 1 minute
  });

  const servicesQuery = useQuery<ServicesResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'services', period],
    queryFn: () =>
      api.get<ServicesResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_SERVICES}?period=${period}`,
      ),
    staleTime: 1000 * 60,
  });

  const statusQuery = useQuery<StatusResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'status', period],
    queryFn: () =>
      api.get<StatusResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_STATUS}?period=${period}`,
      ),
    staleTime: 1000 * 60,
  });

  const isLoading =
    revenueQuery.isLoading || servicesQuery.isLoading || statusQuery.isLoading;

  const isRefreshing =
    revenueQuery.isFetching || servicesQuery.isFetching || statusQuery.isFetching;

  const refetchAll = () => {
    revenueQuery.refetch();
    servicesQuery.refetch();
    statusQuery.refetch();
  };

  return {
    revenueData: revenueQuery.data,
    servicesData: servicesQuery.data,
    statusData: statusQuery.data,
    isLoading,
    isRefreshing,
    error:
      revenueQuery.error || servicesQuery.error || statusQuery.error,
    refetch: refetchAll,
  };
}
