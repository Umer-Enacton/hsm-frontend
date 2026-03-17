"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Calendar } from "lucide-react";
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
import { useProviderAnalytics } from "@/lib/queries/use-provider-analytics";

type PeriodType = "7d" | "30d" | "6m" | "12m" | "all";

interface AnalyticsSectionProps {
  businessId?: number;
}

const periodOptions = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
  { value: "all", label: "All" },
];

export function AnalyticsSection({ businessId }: AnalyticsSectionProps) {
  const [period, setPeriod] = useState<PeriodType>("7d");
  const queryClient = useQueryClient();

  // Invalidate all analytics queries when period changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["provider", "analytics"] });
  }, [period, queryClient]);

  const { revenueData, servicesData, statusData, isLoading, isRefreshing, refetch } =
    useProviderAnalytics(period);

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
            <SelectTrigger className="w-[100px] sm:w-[120px]">
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
            onClick={() => refetch()}
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
    </div>
  );
}
