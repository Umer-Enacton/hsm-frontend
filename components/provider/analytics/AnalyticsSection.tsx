"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "./RevenueChart";
import { ServicesChart } from "./ServicesChart";
import { StatusChart } from "./StatusChart";
import { TimePatternsChart } from "./TimePatternsChart";
import { FreePlanAnalyticsCard, ProPlanAnalyticsCard } from "./AnalyticsUpgradeCards";
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
  const router = useRouter();

  const {
    revenueData,
    servicesData,
    statusData,
    timePatternsData,
    isLoading,
    isRefreshing,
    refetch,
    accessDenied,
    currentPlan,
    allowedGraphs,
  } = useProviderAnalytics(period);

  // Debug: Log current state
  console.log("Analytics Section State:", { currentPlan, allowedGraphs, accessDenied, isLoading });

  // Handle loading skeleton to prevent blank space
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Analytics</h2>
            <p className="text-muted-foreground text-sm">
              Loading your business insights...
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[100px] sm:w-[120px]" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Show free plan upgrade card
  if (accessDenied && currentPlan === "Free") {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Analytics</h2>
            <p className="text-muted-foreground text-sm">
              Upgrade your plan to access powerful insights
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

        {/* Free Plan - Single upgrade card */}
        <FreePlanAnalyticsCard router={router} />
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

      {/* PRO PLAN: Revenue + Status (50/50) + Premium upgrade card */}
      {(currentPlan === "Pro" || (!currentPlan && allowedGraphs.includes("revenue_chart") && !allowedGraphs.includes("trends"))) && (
        <>
          {/* First Row: Revenue + Status (50/50) */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Revenue Chart */}
            {allowedGraphs.includes("revenue_chart") && revenueData ? (
              <RevenueChart
                data={revenueData.chartData}
                period={revenueData.period}
                totalRevenue={revenueData.summary.totalRevenue}
                totalBookings={revenueData.summary.totalBookings}
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue Trends</h3>
                <p className="text-sm text-gray-600 mb-4">Track your earnings over time</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}

            {/* Status Chart */}
            {allowedGraphs.includes("status_chart") && statusData ? (
              <StatusChart
                data={statusData.statusBreakdown}
                totalBookings={statusData.totalBookings}
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Booking Status</h3>
                <p className="text-sm text-gray-600 mb-4">Monitor completion rates and patterns</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>

          {/* Second Row: Full-width Premium upgrade card */}
          <ProPlanAnalyticsCard router={router} />
        </>
      )}

      {/* PREMIUM PLAN: All charts in 3 rows */}
      {(currentPlan === "Premium" || (!currentPlan && allowedGraphs.includes("trends"))) && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* First Row: Revenue (full width) */}
          {allowedGraphs.includes("revenue_chart") && revenueData ? (
            <div className="lg:col-span-2 w-full">
              <RevenueChart
                data={revenueData.chartData}
                period={revenueData.period}
                totalRevenue={revenueData.summary.totalRevenue}
                totalBookings={revenueData.summary.totalBookings}
              />
            </div>
          ) : (
            <div className="lg:col-span-2 w-full">
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue Trends</h3>
                <p className="text-sm text-gray-600 mb-4">Track your earnings over time</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}

          {/* Second Row: Services (50%) + Status (50%) */}
          {allowedGraphs.includes("trends") && servicesData ? (
            <div className="w-full">
              <ServicesChart
                data={servicesData.services}
                totalBookings={servicesData.totalBookings}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Service Performance</h3>
                <p className="text-sm text-gray-600 mb-4">See which services get the most bookings</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}

          {allowedGraphs.includes("status_chart") && statusData ? (
            <div className="w-full">
              <StatusChart
                data={statusData.statusBreakdown}
                totalBookings={statusData.totalBookings}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Booking Status</h3>
                <p className="text-sm text-gray-600 mb-4">Monitor completion rates and patterns</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}

          {/* Third Row: Time Patterns (full width) */}
          {allowedGraphs.includes("time_patterns") && timePatternsData ? (
            <div className="w-full lg:col-span-2">
              <TimePatternsChart data={timePatternsData} />
            </div>
          ) : (
            <div className="w-full lg:col-span-2">
              <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 h-[280px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg">
                  <Lock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Time Patterns & Busy Hours</h3>
                <p className="text-sm text-gray-600 mb-4">See your busiest hours and seasonal trends</p>
                <Button
                  onClick={() => router.push("/provider/subscription")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
