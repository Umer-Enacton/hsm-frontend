"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PeriodSelector } from "./PeriodSelector";
import { AdminRevenueChart } from "./AdminRevenueChart";
import { CategoryChart } from "./CategoryChart";
import { StatusChart } from "./StatusChart";
import { TopProvidersChart } from "./TopProvidersChart";
import { PaymentStatusChart } from "./PaymentStatusChart";
import { AverageOrderValueChart } from "./AverageOrderValueChart";
import { AdminAnalyticsSkeleton } from "@/components/admin/skeletons";

interface AnalyticsSectionProps {
  defaultPeriod?: string;
  enabled?: boolean; // If false, won't fetch until enabled becomes true
}

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
  overallAvg: number;
  chartData: Array<{
    date: string;
    avgOrderValue: number;
    bookingCount: number;
  }>;
}

export function AnalyticsSection({ defaultPeriod = "7d", enabled = true }: AnalyticsSectionProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const queryClient = useQueryClient();

  // Invalidate all analytics queries when period changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
  }, [period, queryClient]);

  // Fetch all analytics data in parallel
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ["admin", "analytics", "revenue", period],
    queryFn: () =>
      api.get<RevenueResponse>(`/admin/analytics/revenue?period=${period}`),
    enabled,
  });

  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["admin", "analytics", "categories", period],
    queryFn: () =>
      api.get<CategoryResponse>(`/admin/analytics/categories?period=${period}`),
    enabled,
  });

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["admin", "analytics", "status", period],
    queryFn: () =>
      api.get<StatusResponse>(`/admin/analytics/status?period=${period}`),
    enabled,
  });

  const { data: providersData, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["admin", "analytics", "providers", period],
    queryFn: () =>
      api.get<ProvidersResponse>(`/admin/analytics/providers?period=${period}`),
    enabled,
  });

  const { data: paymentStatusData, isLoading: isLoadingPaymentStatus } =
    useQuery({
      queryKey: ["admin", "analytics", "payment-status", period],
      queryFn: () =>
        api.get<PaymentStatusResponse>(
          `/admin/analytics/payment-status?period=${period}`,
        ),
      enabled,
    });

  const { data: avgOrderValueData, isLoading: isLoadingAvgOrderValue } =
    useQuery({
      queryKey: ["admin", "analytics", "average-order-value", period],
      queryFn: () =>
        api.get<AverageOrderValueResponse>(
          `/admin/analytics/average-order-value?period=${period}`,
        ),
      enabled,
    });

  const isLoading =
    isLoadingRevenue ||
    isLoadingCategory ||
    isLoadingStatus ||
    isLoadingProviders ||
    isLoadingPaymentStatus ||
    isLoadingAvgOrderValue;
  const hasError =
    revenueError ||
    (!revenueData && !categoryData && !statusData && !providersData);

  if (isLoading) {
    return <AdminAnalyticsSkeleton />;
  }

  if (hasError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load analytics data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Analytics Overview</h2>
          <p className="text-sm text-muted-foreground">
            Platform performance metrics and trends
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          {revenueData && (
            <AdminRevenueChart
              data={revenueData.chartData}
              period={revenueData.period}
              totalPlatformFees={revenueData.summary.platformFees}
              totalBookings={revenueData.summary.totalBookings}
            />
          )}
        </div>

        {/* Category Chart */}
        {categoryData?.categories && categoryData.categories.length > 0 && (
          <CategoryChart
            data={categoryData.categories}
            totalPlatformFees={categoryData.totalPlatformFees}
          />
        )}

        {/* Status Chart */}
        {statusData?.statusBreakdown && statusData.statusBreakdown.length > 0 && (
          <StatusChart
            data={statusData.statusBreakdown}
            totalPlatformFees={statusData.totalPlatformFees}
          />
        )}

        {/* Top Providers Chart */}
        {providersData?.providers && providersData.providers.length > 0 && (
          <TopProvidersChart
            data={providersData.providers}
            totalPlatformFees={providersData.totalPlatformFees}
          />
        )}

        {/* Payment Status Chart */}
        {paymentStatusData?.paymentStatuses && paymentStatusData.paymentStatuses.length > 0 && (
          <PaymentStatusChart
            data={paymentStatusData.paymentStatuses.map((item) => ({
              ...item,
              statusLabel: item.status.charAt(0).toUpperCase() + item.status.slice(1),
              amount: 0, // API doesn't provide this
              platformFees: 0, // API doesn't provide this
              fill:
                item.status === "paid"
                  ? "#22c55e"
                  : item.status === "pending"
                    ? "#f59e0b"
                    : item.status === "failed"
                      ? "#ef4444"
                      : "#6366f1",
            }))}
            totalPayments={paymentStatusData.paymentStatuses.reduce(
              (sum, item) => sum + item.count,
              0,
            )}
            totalAmount={paymentStatusData.totalRevenue || 0}
            totalPlatformFees={0}
          />
        )}

        {/* Average Order Value Chart */}
        {avgOrderValueData && (
          <AverageOrderValueChart
            data={avgOrderValueData.chartData}
            period={avgOrderValueData.period}
            overallAvg={avgOrderValueData.overallAvg}
          />
        )}
      </div>
    </div>
  );
}
