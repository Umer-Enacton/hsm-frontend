"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  IndianRupee,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, API_ENDPOINTS } from "@/lib/api";
import { getUserData } from "@/lib/auth-utils";
import { QUERY_KEYS } from "@/lib/queries/query-keys";

interface Booking {
  id: number;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  businessAddress: string;
  bookingDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  totalPrice: number;
}

interface EarningData {
  totalEarnings: number;
  pendingPayout: number;
  paidAmount: number;
  completedBookings: number;
}

interface DashboardStats {
  todayBookings: number;
  upcomingBookings: number;
  completedThisMonth: number;
  totalEarnings: number;
  pendingPayout: number;
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    setUserData(getUserData());
  }, []);

  // TanStack Query for bookings
  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
    refetch: refetchBookings,
  } = useQuery<Booking[]>({
    queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS, "staff"],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: Booking[] }>(
        API_ENDPOINTS.BOOKING_STAFF_MY_BOOKINGS,
      );
      return response.data;
    },
  });

  // TanStack Query for earnings
  const {
    data: earningsData,
    isLoading: isLoadingEarnings,
  } = useQuery<{
    earnings: any[];
    totals: {
      totalEarnings: number;
      pendingPayout: number;
      paidAmount: number;
      completedBookings: number;
    };
  }>({
    queryKey: ["staff", "earnings", "month"],
    queryFn: async () => {
      const response = await api.get<{
        message: string;
        data: {
          earnings: any[];
          totals: {
            totalEarnings: number;
            pendingPayout: number;
            paidAmount: number;
            completedBookings: number;
          };
        };
      }>(
        `${API_ENDPOINTS.STAFF_PAYOUTS_MY_EARNINGS}?period=month`,
      );
      return response.data;
    },
  });

  // Extract totals for easier access
  const earnings = earningsData?.totals;

  const isLoading = isLoadingBookings || isLoadingEarnings;

  // Calculate stats
  const stats = useMemo<DashboardStats>(() => {
    const today = new Date().toDateString();
    const todayBookingCount = bookings.filter((b) => {
      const bookingDate = new Date(b.bookingDate).toDateString();
      return bookingDate === today;
    }).length;

    const upcomingCount = bookings.filter((b) => {
      const bookingDate = new Date(b.bookingDate);
      return bookingDate > new Date();
    }).length;

    return {
      todayBookings: todayBookingCount,
      upcomingBookings: upcomingCount,
      completedThisMonth: earnings?.completedBookings || 0,
      totalEarnings: earnings?.totalEarnings || 0,
      pendingPayout: earnings?.pendingPayout || 0,
    };
  }, [bookings, earnings]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["staff", "bookings"] });
    queryClient.invalidateQueries({ queryKey: ["staff", "earnings"] });
  };

  const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInPaise / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.bookingDate);
    return bookingDate > new Date();
  }).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="h-7 w-40 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your overview for today.
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

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Today's Bookings */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Today&apos;s Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.todayBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayBookings === 1 ? "booking scheduled" : "bookings scheduled"}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Upcoming Jobs
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {stats.upcomingBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingBookings === 1 ? "job assigned" : "jobs assigned"}
            </p>
          </CardContent>
        </Card>

        {/* Completed This Month */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Completed This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {stats.completedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedThisMonth === 1 ? "job completed" : "jobs completed"}
            </p>
          </CardContent>
        </Card>

        {/* Earnings This Month */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Earnings This Month
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-purple-600" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(stats.totalEarnings / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total earnings this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Details Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <IndianRupee className="h-5 w-5" />
            Your Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Earned
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(earnings?.paidAmount || 0)}
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
                {formatCurrency(earnings?.pendingPayout || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                Awaiting transfer
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Earnings
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency((earnings?.paidAmount || 0) + (earnings?.pendingPayout || 0))}
              </p>
              <p className="text-xs text-muted-foreground">Total + Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming bookings
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{booking.serviceName}</p>
                        <Badge className={getStatusColor(booking.status)} variant="secondary">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.businessAddress}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium whitespace-nowrap">
                        {booking.slotStartTime}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {booking.slotEndTime}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(booking.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/staff/bookings")}
                className="gap-2 justify-start"
              >
                <Calendar className="h-4 w-4" />
                View My Bookings
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/staff/earnings")}
                className="gap-2 justify-start"
              >
                <DollarSign className="h-4 w-4" />
                View Earnings
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/staff/leave")}
                className="gap-2 justify-start"
              >
                <TrendingUp className="h-4 w-4" />
                Request Leave
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
