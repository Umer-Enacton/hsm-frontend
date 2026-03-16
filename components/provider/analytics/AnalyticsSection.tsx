"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Calendar } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RevenueChart } from "./RevenueChart";
import { ServicesChart } from "./ServicesChart";
import { StatusChart } from "./StatusChart";
import { toast } from "sonner";

type PeriodType = "7d" | "30d" | "6m" | "12m" | "all";

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

interface AnalyticsSectionProps {
  businessId?: number;
}

const periodOptions = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

export function AnalyticsSection({ businessId }: AnalyticsSectionProps) {
  const [period, setPeriod] = useState<PeriodType>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueResponse | null>(null);
  const [servicesData, setServicesData] = useState<ServicesResponse | null>(
    null,
  );
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);

  const fetchAnalytics = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [revenue, services, status] = await Promise.all([
        api.get<RevenueResponse>(
          `${API_ENDPOINTS.PROVIDER_ANALYTICS_REVENUE}?period=${period}`,
        ),
        api.get<ServicesResponse>(
          `${API_ENDPOINTS.PROVIDER_ANALYTICS_SERVICES}?period=${period}`,
        ),
        api.get<StatusResponse>(
          `${API_ENDPOINTS.PROVIDER_ANALYTICS_STATUS}?period=${period}`,
        ),
      ]);

      setRevenueData(revenue);
      setServicesData(services);
      setStatusData(status);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      toast.error(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleRefresh = () => {
    fetchAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Track your performance and revenue trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(v: PeriodType) => setPeriod(v)}
          >
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Revenue Chart - Full Width */}
        <div className="lg:col-span-2 w-full">
          {revenueData && (
            <RevenueChart
              data={revenueData.chartData}
              period={revenueData.period}
              totalRevenue={revenueData.summary.totalRevenue}
              totalBookings={revenueData.summary.totalBookings}
            />
          )}
        </div>

        {/* Services Chart */}
        <div className="w-full">
          {servicesData && (
            <ServicesChart
              data={servicesData.services}
              totalBookings={servicesData.totalBookings}
            />
          )}
        </div>

        {/* Status Chart */}
        <div className="w-full">
          {statusData && (
            <StatusChart
              data={statusData.statusBreakdown}
              totalBookings={statusData.totalBookings}
            />
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {/* {(revenueData || servicesData || statusData) && (
        <div className="grid gap-4 md:grid-cols-4">
          {revenueData && (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Total Revenue (Your 95%)
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ₹
                  {revenueData.summary.totalRevenue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Total Bookings
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {revenueData.summary.totalBookings}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800">
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Completed
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {revenueData.summary.totalCompleted}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800">
                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {revenueData.summary.completionRate}%
                </div>
              </div>
            </>
          )}
        </div>
      )} */}
    </div>
  );
}
