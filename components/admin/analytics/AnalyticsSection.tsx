"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { AdminRevenueChart } from "./AdminRevenueChart";
import { CategoryChart } from "./CategoryChart";
import { StatusChart } from "./StatusChart";
import { TopProvidersChart } from "./TopProvidersChart";
import { PaymentStatusChart } from "./PaymentStatusChart";
import { AverageOrderValueChart } from "./AverageOrderValueChart";

interface AnalyticsSectionProps {
  defaultPeriod?: string;
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
  totalPlatformFees: number;
}

interface PaymentStatusResponse {
  period: string;
  totalPayments: number;
  statusBreakdown: Array<{
    status: string;
    statusLabel: string;
    count: number;
    amount: number;
    platformFees: number;
    percentage: string;
    fill: string;
  }>;
  totalAmount: number;
  totalPlatformFees: number;
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

export function AnalyticsSection({
  defaultPeriod = "30d",
}: AnalyticsSectionProps) {
  const [period, setPeriod] = useState(defaultPeriod);

  // Fetch all analytics data in parallel
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ["admin", "analytics", "revenue", period],
    queryFn: () =>
      api.get<RevenueResponse>(`/admin/analytics/revenue?period=${period}`),
  });

  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["admin", "analytics", "categories", period],
    queryFn: () =>
      api.get<CategoryResponse>(`/admin/analytics/categories?period=${period}`),
  });

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["admin", "analytics", "status", period],
    queryFn: () =>
      api.get<StatusResponse>(`/admin/analytics/status?period=${period}`),
  });

  const { data: providersData, isLoading: isLoadingProviders } = useQuery({
    queryKey: ["admin", "analytics", "providers", period],
    queryFn: () =>
      api.get<ProvidersResponse>(`/admin/analytics/providers?period=${period}`),
  });

  const { data: paymentStatusData, isLoading: isLoadingPaymentStatus } =
    useQuery({
      queryKey: ["admin", "analytics", "payment-status", period],
      queryFn: () =>
        api.get<PaymentStatusResponse>(
          `/admin/analytics/payment-status?period=${period}`,
        ),
    });

  const { data: avgOrderValueData, isLoading: isLoadingAvgOrderValue } =
    useQuery({
      queryKey: ["admin", "analytics", "average-order-value", period],
      queryFn: () =>
        api.get<AverageOrderValueResponse>(
          `/admin/analytics/average-order-value?period=${period}`,
        ),
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load analytics data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">Analytics Overview</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Revenue & Bookings Chart */}
      {revenueData && (
        <AdminRevenueChart
          data={revenueData.chartData}
          period={revenueData.period}
          totalPlatformFees={revenueData.summary.platformFees}
          totalBookings={revenueData.summary.totalBookings}
        />
      )}

      {/* Four Column Layout - Category, Status, Payment Status & Avg Order Value */}
      <div className="grid gap-6 lg:grid-cols-3">
        {categoryData && (
          <CategoryChart
            data={categoryData.categories}
            totalPlatformFees={categoryData.totalPlatformFees}
          />
        )}
        {avgOrderValueData && (
          <AverageOrderValueChart
            data={avgOrderValueData.chartData}
            period={avgOrderValueData.period}
            overallAvg={avgOrderValueData.overallAvg}
          />
        )}
        {/* {statusData && (
          <StatusChart
            data={statusData.statusBreakdown}
            totalPlatformFees={statusData.totalPlatformFees}
          />
        )} */}
        {paymentStatusData && (
          <PaymentStatusChart
            data={paymentStatusData.statusBreakdown}
            totalPayments={paymentStatusData.totalPayments}
            totalAmount={paymentStatusData.totalAmount}
            totalPlatformFees={paymentStatusData.totalPlatformFees}
          />
        )}
      </div>

      {/* Top Providers Chart */}
      {providersData && (
        <TopProvidersChart
          data={providersData.providers}
          totalPlatformFees={providersData.totalPlatformFees}
        />
      )}
    </div>
  );
}
