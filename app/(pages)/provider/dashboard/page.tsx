"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
import { ProviderDashboardSkeleton } from "@/components/provider/skeletons/ProviderDashboardSkeleton";
import { AnalyticsSection } from "@/components/provider/analytics";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  RefreshCw,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import {
  useProviderBusiness,
  useProviderServices,
} from "@/lib/queries/use-provider-dashboard";
import { useProviderBookings } from "@/lib/queries/use-provider-bookings";
import { useProviderRevenueStats } from "@/lib/queries/use-provider-revenue";
import { useProviderAnalytics } from "@/lib/queries/use-provider-analytics";
import { QUERY_KEYS } from "@/lib/queries/query-keys";
import type { ProviderBooking } from "@/types/provider";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData] = useState(() => getUserData());

  // TanStack Query hooks - all run in parallel
  const { data: business } = useProviderBusiness(userData?.id);
  const { data: bookingsData } = useProviderBookings();
  const bookings = bookingsData?.bookings || [];
  const { data: services = [] } = useProviderServices(business?.id);
  const { data: revenueStats, isLoading: isLoadingRevenue } =
    useProviderRevenueStats();
  const { isLoading: isLoadingAnalytics } = useProviderAnalytics();



  // Calculate stats directly from bookings data (to avoid race condition with separate query)
  const computedStats = useMemo(() => {
    // Debug logging
    console.log(
      "Dashboard bookings:",
      bookings.length,
      bookings.map((b: ProviderBooking) => ({ id: b.id, status: b.status })),
    );

    return {
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "confirmed",
      ).length,
      completedBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "completed",
      ).length,
      cancelledBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "cancelled",
      ).length,
      totalEarnings: revenueStats?.totalEarnings || 0,
      averageRating: business?.rating || 0,
      totalReviews: business?.totalReviews || 0,
    };
  }, [bookings, revenueStats, business]);

  const isLoading = !business || isLoadingRevenue || isLoadingAnalytics;

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.PROVIDER_BUSINESS],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.PROVIDER_SERVICES],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.PROVIDER_DASHBOARD],
    });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_REVENUE] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_ANALYTICS] });
  };

  // Calculate today's bookings (Only confirmed ones for today's schedule)
  const todayBookings = useMemo(
    () =>
      bookings.filter((b: ProviderBooking) => {
        if (b.status !== "confirmed") return false;
        const dateStr = b.date || b.bookingDate || "";
        if (!dateStr) return false;
        const bookingDate = new Date(dateStr).toDateString();
        return bookingDate === new Date().toDateString();
      }).length,
    [bookings],
  );

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "N/A";
  };

  if (isLoading) {
    return <ProviderDashboardSkeleton />;
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Unable to load dashboard.</p>
        <Button onClick={() => router.push("/provider/business")}>
          Setup Business
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 whitespace-nowrap"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Verification Alert - only show if NOT verified */}
      {business && !business.isVerified && (
        <VerificationAlert isVerified={false} businessName={business.name} />
      )}

      {/* Payment Details Warning - only show if no payment details */}
      {business && !business.hasPaymentDetails && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-300 flex-1">
                <p className="font-medium mb-1">Payment Details Required</p>
                <p className="text-orange-700 dark:text-orange-400">
                  You must add payment details (UPI ID or Bank Account) to
                  receive bookings and earnings. Without payment details,
                  customers cannot book your services.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/provider/payments")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Add Payment Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {computedStats.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {computedStats.completedBookings} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Bookings Today
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {todayBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayBookings > 0 ? "Check your schedule" : "Quiet day today"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {(revenueStats?.totalEarnings || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-[10px] text-muted-foreground">
                Net earnings from services
              </p>
              {Number(revenueStats?.rescheduleRevenue || 0) > 0 && (
                <p className="text-[10px] text-purple-600 font-medium">
                  + ₹{(revenueStats?.rescheduleRevenue || 0)} reschedule fees
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {formatRating(computedStats.averageRating)}
              </div>
              {computedStats.averageRating > 0 && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {computedStats.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Earnings Details - Provider's 95% Share */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <IndianRupee className="h-5 w-5" />
            Your Earnings (95% Share)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-green-600">
                ₹
                {(revenueStats?.paidPayouts || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                Received in your account
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Pending Payout
              </p>
              <p className="text-2xl font-bold text-orange-600">
                ₹
                {(revenueStats?.pendingPayouts || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">Awaiting transfer</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Earnings After Payout
              </p>
              <p className="text-2xl font-bold">
                ₹
                {(
                  (revenueStats?.paidPayouts || 0) +
                  (revenueStats?.pendingPayouts || 0)
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">Total + Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}

      {/* Analytics Section */}
      <AnalyticsSection businessId={business?.id} />
    </div>
  );
}

