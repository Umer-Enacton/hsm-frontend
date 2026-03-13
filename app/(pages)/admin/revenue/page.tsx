"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  IndianRupee,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RevenueStats {
  totalRevenue: number;
  platformFees: number;
  providerPayouts: number;
  totalBookings: number;
  breakdown: {
    period: string;
    revenue: number;
    platformFees: number;
    bookings: number;
  }[];
}

export default function AdminRevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRevenueData = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response: any = await api.get(API_ENDPOINTS.ADMIN_REVENUE);
      setStats(response);
    } catch (err: any) {
      console.error("Failed to fetch revenue data:", err);
      setError(err.message || "Failed to load revenue data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const exportReport = () => {
    // TODO: Implement CSV export
    console.log("Exporting revenue report...");
  };

  if (isLoading) {
    return <LoadingState message="Loading revenue data..." />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={() => fetchRevenueData()} />;
  }

  const formatCurrency = (amount: number) => {
    // Backend stores amounts in paise, convert to rupees
    const amountInRupees = amount / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInRupees);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Platform Revenue (5% Commission)"
        description="Track your platform fee earnings from all bookings. For every ₹500 booking, you receive ₹25 as platform commission."
        onRefresh={() => fetchRevenueData(true)}
        isRefreshing={isRefreshing}
        action={{
          label: "Export Report",
          icon: Download,
          onClick: exportReport,
        }}
      />

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Platform Fees (Your 5%)"
          value={formatCurrency(stats?.platformFees || 0)}
          change="Platform commission from all bookings"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Total Bookings Value"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change="Total amount processed (for reference)"
          icon={DollarSign}
          trend="neutral"
        />
        <StatCard
          title="Provider Payouts"
          value={formatCurrency(stats?.providerPayouts || 0)}
          change="95% paid to service providers"
          icon={IndianRupee}
          trend="up"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings?.toLocaleString() || "0"}
          change="All time bookings"
          icon={Calendar}
          trend="neutral"
        />
      </div>

      {/* Revenue Breakdown */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Monthly Platform Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {stats?.breakdown && stats.breakdown.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Period</div>
                <div className="text-right">Platform Fees (5%)</div>
                <div className="text-right">Total Bookings</div>
                <div className="text-right">Avg per Booking</div>
              </div>
              {stats.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-4 gap-4 text-sm items-center border-b border-dashed last:border-0 pb-2 last:pb-0"
                >
                  <div className="font-medium">{item.period}</div>
                  <div className="text-right font-semibold text-purple-600">
                    {formatCurrency(item.platformFees)}
                  </div>
                  <div className="text-right text-muted-foreground">
                    {item.bookings}
                  </div>
                  <div className="text-right text-muted-foreground">
                    {item.bookings > 0
                      ? formatCurrency(item.platformFees / item.bookings)
                      : "₹0"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No revenue data available yet.</p>
              <p className="text-sm mt-1">
                Revenue data will appear once payments are processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Fee Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Understanding Revenue Split</p>
              <p className="text-blue-700 dark:text-blue-400">
                For each booking, the platform fee is automatically deducted and
                the remaining amount is paid to the service provider. You can
                adjust the platform fee percentage in the{" "}
                <a href="/admin/settings" className="underline font-medium">
                  Settings
                </a>{" "}
                page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/settings")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Adjust Platform Fee
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/payments")}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Payment Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/admin/bookings")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
