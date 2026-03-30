"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
import { ProviderDashboardSkeleton } from "@/components/provider/skeletons/ProviderDashboardSkeleton";
import { AnalyticsSection } from "@/components/provider/analytics";
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  ArrowRight,
  IndianRupee,
  RefreshCw,
  AlertCircle,
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
import { cn } from "@/lib/utils";
import type { ProviderBooking } from "@/types/provider";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData] = useState(() => getUserData());

  // TanStack Query hooks - all run in parallel
  const { data: business } = useProviderBusiness(userData?.id);
  const { data: bookings = [] } = useProviderBookings();
  const { data: services = [] } = useProviderServices(business?.id);
  const { data: revenueStats, isLoading: isLoadingRevenue } =
    useProviderRevenueStats();
  const { isLoading: isLoadingAnalytics } = useProviderAnalytics();

  // Helper function to get booking date safely
  const getBookingDate = (b: ProviderBooking) => {
    const dateStr = b.date || b.bookingDate || "";
    return new Date(dateStr).getTime();
  };

  // Derived values
  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(
          (b: ProviderBooking) =>
            b.status === "confirmed" || b.status === "pending",
        )
        .sort((a, b) => getBookingDate(a) - getBookingDate(b))
        .slice(0, 3),
    [bookings],
  );

  // Calculate today's bookings
  const todayBookings = useMemo(
    () =>
      bookings.filter((b: ProviderBooking) => {
        const dateStr = b.date || b.bookingDate || "";
        if (!dateStr) return false;
        const bookingDate = new Date(dateStr).toDateString();
        return bookingDate === new Date().toDateString();
      }).length,
    [bookings],
  );

  // Calculate cancelled bookings
  const cancelledBookings = useMemo(
    () =>
      bookings.filter(
        (b: ProviderBooking) =>
          b.status === "cancelled" || b.status === "rejected",
      ).length,
    [bookings],
  );

  // Calculate active services
  const activeServices = useMemo(
    () => services.filter((s: any) => s.isActive || s.is_active).length,
    [services],
  );

  // Calculate stats directly from bookings data (to avoid race condition with separate query)
  const computedStats = useMemo(() => {
    // Debug logging
    console.log(
      "Dashboard bookings:",
      bookings.length,
      bookings.map((b: any) => ({ id: b.id, status: b.status })),
    );

    return {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "pending",
      ).length,
      confirmedBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "confirmed",
      ).length,
      completedBookings: bookings.filter(
        (b: ProviderBooking) => b.status === "completed",
      ).length,
      totalEarnings: revenueStats?.totalEarnings || 0,
    };
  }, [bookings, revenueStats]);

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

  const formatRating = (rating: number) => {
    return rating > 0 ? rating.toFixed(1) : "N/A";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
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
            Welcome back! Here's what's happening with your business.
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

      {/* Today's Snapshot */}
      {(todayBookings > 0 || computedStats.pendingBookings > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold">{todayBookings}</p>
                  <p className="text-xs text-muted-foreground">
                    Bookings today
                  </p>
                </div>
                {computedStats.pendingBookings > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {computedStats.pendingBookings}
                    </p>
                    <p className="text-xs text-muted-foreground">Need action</p>
                  </div>
                )}
              </div>
              {computedStats.pendingBookings > 0 && (
                <Button
                  size="sm"
                  onClick={() =>
                    router.push("/provider/bookings?status=pending")
                  }
                  className="gap-2"
                >
                  View Pending
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {computedStats.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {computedStats.completedBookings} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {computedStats.pendingBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {computedStats.pendingBookings > 0
                ? "Action required"
                : "No pending"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {(revenueStats?.totalEarnings || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your 95% share from all bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {formatRating(business.rating || 0)}
              </div>
              {(business.rating || 0) > 0 && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {business.totalReviews || 0} reviews
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

