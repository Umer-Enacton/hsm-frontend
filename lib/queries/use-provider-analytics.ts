'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

type PeriodType = '7d' | '30d' | '6m' | '12m' | 'all';

interface RevenueResponse {
  period: string;
  startDate: string;
  endDate: string;
  allowedGraphs?: string[];
  availableCharts?: Array<{ id: string; name: string }>;
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

export interface TimePatternsResponse {
  period: string;
  totalBookings: number;
  hourlyData: Array<{
    hour: string;
    hourLabel: string;
    bookingCount: number;
    fill: string;
  }>;
  dailyData: Array<{
    day: string;
    dayLabel: string;
    bookingCount: number;
    fill: string;
  }>;
  peakHour: { hour: string; count: number };
  peakDay: { day: string; count: number };
}

interface AnalyticsError {
  code?: string;
  message: string;
  currentPlan?: string;
}

/**
 * Provider analytics queries
 * Analytics data changes moderately - historical data doesn't change
 * but recent bookings may update status
 */
export function useProviderAnalytics(period: PeriodType = '7d') {
  const revenueQuery = useQuery<RevenueResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'revenue', period],
    queryFn: () =>
      api.get<RevenueResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_REVENUE}?period=${period}`,
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: false, // Don't retry on 403 errors - fail immediately
    // Preserve state across React Strict Mode double-invocation
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const servicesQuery = useQuery<ServicesResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'services', period],
    queryFn: () =>
      api.get<ServicesResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_SERVICES}?period=${period}`,
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    // Only fetch if trends is allowed (Premium only)
    enabled: !!revenueQuery.data && revenueQuery.data.allowedGraphs?.includes('trends'),
  });

  const statusQuery = useQuery<StatusResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'status', period],
    queryFn: () =>
      api.get<StatusResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_STATUS}?period=${period}`,
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes - status can change more frequently
    gcTime: 20 * 60 * 1000,
    // Only fetch if status_chart is allowed (Pro/Premium)
    enabled: !!revenueQuery.data && revenueQuery.data.allowedGraphs?.includes('status_chart'),
  });

  const timePatternsQuery = useQuery<TimePatternsResponse>({
    queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS, 'time-patterns', period],
    queryFn: () =>
      api.get<TimePatternsResponse>(
        `${API_ENDPOINTS.PROVIDER_ANALYTICS_TIME_PATTERNS}?period=${period}`,
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    // Only fetch if time_patterns is allowed (Premium only)
    enabled: !!revenueQuery.data && revenueQuery.data.allowedGraphs?.includes('time_patterns'),
  });

  const isLoading =
    revenueQuery.isLoading || servicesQuery.isLoading || statusQuery.isLoading || timePatternsQuery.isLoading;

  const isRefreshing =
    revenueQuery.isFetching || servicesQuery.isFetching || statusQuery.isFetching || timePatternsQuery.isFetching;

  // Check if analytics access is denied
  // Debug: log the error to see the actual structure
  const hasError = !!revenueQuery.error;
  let accessDenied = false;
  let currentPlan = 'Free';

  if (hasError) {
    const error = revenueQuery.error as any;
    // Log the full error structure for debugging
    console.log('🔍 Analytics error structure:', {
      message: error?.message,
      code: error?.code,
      cause: error?.cause,
      statusCode: error?.statusCode,
      response: error?.response,
    });

    // Check multiple paths where the code might be stored
    const errorCode = error?.code || error?.cause?.code || error?.response?.data?.code;
    accessDenied = errorCode === 'ANALYTICS_ACCESS_DENIED';
    currentPlan = error?.cause?.currentPlan || error?.currentPlan || error?.response?.data?.currentPlan || 'Free';

    console.log('🔍 Access denied check:', { errorCode, accessDenied, currentPlan });
  }

  const allowedGraphs = revenueQuery.data?.allowedGraphs || [];

  // Derive plan from allowedGraphs for successful responses
  if (!hasError && allowedGraphs.length > 0) {
    if (allowedGraphs.includes('trends')) {
      currentPlan = 'Premium';
    } else if (allowedGraphs.includes('status_chart')) {
      currentPlan = 'Pro';
    } else {
      currentPlan = 'Free';
    }
    console.log('🔍 Derived plan from allowedGraphs:', { currentPlan, allowedGraphs });
  }
  const availableCharts = revenueQuery.data?.availableCharts || [];

  const refetchAll = () => {
    revenueQuery.refetch();
    servicesQuery.refetch();
    statusQuery.refetch();
    timePatternsQuery.refetch();
  };

  return {
    revenueData: revenueQuery.data,
    servicesData: servicesQuery.data,
    statusData: statusQuery.data,
    timePatternsData: timePatternsQuery.data,
    isLoading,
    isRefreshing,
    accessDenied,
    currentPlan,
    allowedGraphs,
    availableCharts,
    error:
      revenueQuery.error || servicesQuery.error || statusQuery.error || timePatternsQuery.error,
    refetch: refetchAll,
  };
}
