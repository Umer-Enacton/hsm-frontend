"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
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
  Hourglass,
  ArrowRight,
  IndianRupee,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness } from "@/lib/provider/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardStats {
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalServices: number;
  activeServices: number;
  totalReviews: number;
  averageRating: number;
  monthlyRevenue: number;
  upcomingBookings: any[];
  recentBookings: any[];
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userData = getUserData();
        if (userData) {
          const businessData = await getProviderBusiness(userData.id);
          setBusiness(businessData);

          // Fetch bookings for stats
          const bookingsResponse: any = await api.get(API_ENDPOINTS.PROVIDER_BOOKINGS);
          const bookings = Array.isArray(bookingsResponse)
            ? bookingsResponse
            : (bookingsResponse?.bookings || []);

          // Calculate stats
          const today = new Date().toDateString();
          const todayBookings = bookings.filter((b: any) => {
            const bookingDate = new Date(b.date || b.bookingDate).toDateString();
            return bookingDate === today;
          }).length;

          const pendingBookings = bookings.filter((b: any) => b.status === "pending").length;
          const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed").length;
          const completedBookings = bookings.filter((b: any) => b.status === "completed").length;
          const cancelledBookings = bookings.filter((b: any) => b.status === "cancelled" || b.status === "rejected").length;

          // Calculate revenue (from completed bookings)
          const monthlyRevenue = bookings
            .filter((b: any) => {
              const isCompleted = b.status === "completed";
              const bookingDate = new Date(b.date || b.bookingDate);
              const now = new Date();
              const isThisMonth =
                bookingDate.getMonth() === now.getMonth() &&
                bookingDate.getFullYear() === now.getFullYear();
              return isCompleted && isThisMonth;
            })
            .reduce((sum: number, b: any) => sum + (b.price || b.totalPrice || 0), 0);

          // Fetch services
          const servicesResponse: any = await api.get(API_ENDPOINTS.SERVICES_BY_BUSINESS(businessData.id));
          const services = Array.isArray(servicesResponse)
            ? servicesResponse
            : (servicesResponse?.services || servicesResponse?.data || []);
          const activeServices = services.filter((s: any) => s.isActive || s.is_active).length;

          // Upcoming bookings (next 3)
          const upcoming = bookings
            .filter((b: any) => b.status === "confirmed" || b.status === "pending")
            .sort((a: any, b: any) => new Date(a.date || a.bookingDate).getTime() - new Date(b.date || b.bookingDate).getTime())
            .slice(0, 3);

          // Recent bookings (pending first)
          const recent = bookings
            .sort((a: any, b: any) => {
              if (a.status === "pending" && b.status !== "pending") return -1;
              if (a.status !== "pending" && b.status === "pending") return 1;
              return new Date(b.date || b.bookingDate).getTime() - new Date(a.date || a.bookingDate).getTime();
            })
            .slice(0, 5);

          setStats({
            todayBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            cancelledBookings,
            totalServices: services.length,
            activeServices,
            totalReviews: businessData.totalReviews || 0,
            averageRating: businessData.rating || 0,
            monthlyRevenue,
            upcomingBookings: upcoming,
            recentBookings: recent,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleBookingAction = (bookingId: number, action: string) => {
    router.push(`/provider/bookings?action=${action}&id=${bookingId}`);
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
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Unable to load dashboard.</p>
        <Button onClick={() => router.push("/provider/business")}>Setup Business</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Verification Alert */}
      {business && (
        <VerificationAlert
          isVerified={business.isVerified}
          businessName={business.name}
        />
      )}

      {/* Today's Snapshot */}
      {(stats.todayBookings > 0 || stats.pendingBookings > 0) && (
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
                  <p className="text-2xl font-bold">{stats.todayBookings}</p>
                  <p className="text-xs text-muted-foreground">Bookings today</p>
                </div>
                {stats.pendingBookings > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingBookings}</p>
                    <p className="text-xs text-muted-foreground">Need action</p>
                  </div>
                )}
              </div>
              {stats.pendingBookings > 0 && (
                <Button
                  size="sm"
                  onClick={() => router.push("/provider/bookings?status=pending")}
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
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings + stats.confirmedBookings + stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedBookings} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingBookings > 0 ? "Action required" : "No pending"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-foreground" />
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{formatRating(stats.averageRating)}</div>
              {stats.averageRating > 0 && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Bookings</CardTitle>
              {stats.upcomingBookings.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/provider/bookings")}
                  className="gap-1"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stats.upcomingBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/provider/bookings?id=${booking.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.serviceName || booking.service?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(booking.date || booking.bookingDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(booking.startTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings - Priority View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              {stats.recentBookings.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/provider/bookings")}
                  className="gap-1"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-center justify-between gap-3",
                      booking.status === "pending" && "bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{booking.customerName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.serviceName || booking.service?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                            onClick={() => handleBookingAction(booking.id, "accept")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleBookingAction(booking.id, "reject")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Badge
                        variant={
                          booking.status === "pending"
                            ? "default"
                            : booking.status === "confirmed"
                            ? "secondary"
                            : booking.status === "completed"
                            ? "outline"
                            : "secondary"
                        }
                        className="text-xs whitespace-nowrap"
                      >
                        {booking.status === "pending" && (
                          <Hourglass className="h-3 w-3 mr-1" />
                        )}
                        {booking.status === "confirmed" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {booking.status === "completed" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeServices}/{stats.totalServices}</p>
                <p className="text-xs text-muted-foreground">Active Services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedBookings}</p>
                <p className="text-xs text-muted-foreground">Completed Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
