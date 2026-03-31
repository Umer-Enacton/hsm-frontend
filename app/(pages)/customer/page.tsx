"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Star,
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  CalendarDays,
  TrendingUp,
  Wallet,
  IndianRupee,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useRecentBookings,
  useBookingStats,
  useFeaturedServices,
} from "@/lib/queries";
import type { CustomerBooking, CustomerService } from "@/types/customer";
import { CustomerDashboardSkeleton } from "@/components/customer/skeletons/CustomerDashboardSkeleton";
import { getCustomerBookings } from "@/lib/customer/api";
import { useQuery } from "@tanstack/react-query";

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

// Helper function to prepare service activity data for chart
const getServiceActivityData = (bookings: any[]) => {
  // Safe date parsing helper
  const parseDate = (dateStr: string | Date) => {
    if (!dateStr) return new Date();
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Count bookings by status
  const upcoming = bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    const bookingDate = parseDate(b.bookingDate || b.date);
    return bookingDate >= new Date();
  }).length;

  const pending = bookings.filter((b) => b.status === "pending").length;

  const completed = bookings.filter((b) => b.status === "completed").length;

  return [
    {
      name: "Upcoming",
      count: upcoming,
      description: "Scheduled services",
      color: "#3b82f6",
      status: "services",
    },
    {
      name: "Pending",
      count: pending,
      description: "Awaiting confirmation",
      color: "#f59e0b",
      status: "requests",
    },
    {
      name: "Completed",
      count: completed,
      description: "Finished services",
      color: "#22c55e",
      status: "done",
    },
  ];
};

export default function CustomerDashboardPage() {
  const router = useRouter();

  // All queries run in parallel
  const { data: recentBookings = [], isLoading: isLoadingBookings } =
    useRecentBookings();
  const {
    data: stats = {
      totalBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
    },
    isLoading: isLoadingStats,
  } = useBookingStats();
  const { data: featuredServices = [], isLoading: isLoadingServices } =
    useFeaturedServices();

  // Fetch all bookings for analytics
  const { data: allBookingsData } = useQuery({
    queryKey: ["customer", "bookings", "all"],
    queryFn: () => getCustomerBookings(),
    staleTime: 60 * 1000,
  });

  const allBookings = allBookingsData?.bookings || [];
  const isLoading = isLoadingBookings || isLoadingStats || isLoadingServices;

  // Calculate analytics from booking data
  const analytics = useMemo(() => {
    const monthlySpending: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};
    let totalSpent = 0;
    const last6Months: string[] = [];

    // Generate last 6 months keys
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      last6Months.push(key);
      monthlySpending[key] = 0;
    }

    // Process bookings
    allBookings.forEach((booking: CustomerBooking) => {
      const bookingDate = new Date(booking.bookingDate);
      const monthKey = bookingDate.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      // Add to spending (only completed bookings)
      if (booking.status === "completed" && booking.totalPrice) {
        const amount = booking.totalPrice;
        totalSpent += amount;
        if (monthlySpending[monthKey] !== undefined) {
          monthlySpending[monthKey] += amount;
        }
      }

      // Count by service name (since category isn't available in booking data)
      const serviceName = booking.service?.name || "Other Service";
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });

    // Convert to chart arrays
    const spendingChartData = last6Months.map((month) => ({
      month,
      spending: monthlySpending[month] || 0,
    }));

    const serviceChartData = Object.entries(serviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      serviceChartData,
      totalSpent,
      upcomingCount: allBookings.filter((b) => {
        if (b.status !== "confirmed") return false;
        const bookingDate = new Date(b.bookingDate);
        return bookingDate >= new Date();
      }).length,
      avgSpendingPerBooking:
        stats.completedBookings > 0 ? totalSpent / stats.completedBookings : 0,
    };
  }, [allBookings, stats.completedBookings]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return <CustomerDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome Back! 👋
        </h1>
        <p className="text-muted-foreground">
          Find and book home services from verified providers
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">
              Upcoming
            </CardTitle>
            <Clock className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
              {analytics.upcomingCount}
            </div>
            <p className="text-xs text-muted-foreground">Confirmed services</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Service Activity Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Service Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  No service activity yet
                </p>
                <Link href="/customer/services">
                  <Button size="sm">Browse Services</Button>
                </Link>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={220}
                className="text-foreground"
              >
                <BarChart
                  data={getServiceActivityData(recentBookings)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-md shadow-lg p-3">
                            <p className="font-semibold text-sm">{data.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">
                              {data.description}
                            </p>
                            <p
                              className="text-lg font-bold"
                              style={{ color: data.color }}
                            >
                              {data.count} {data.status}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 8, 8, 0]}
                    isAnimationActive={false}
                  >
                    {getServiceActivityData(recentBookings).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Services Breakdown */}
        {analytics.serviceChartData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Most Booked Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="40%" height={180}>
                  <PieChart>
                    <Pie
                      data={analytics.serviceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {analytics.serviceChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {analytics.serviceChartData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span
                          className="text-muted-foreground truncate max-w-[120px]"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="font-semibold">
                        {item.value} booking{item.value > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                No Bookings Yet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-muted-foreground text-center">
                Book your first service to see category breakdown
              </p>
              <Link href="/customer/services" className="mt-3">
                <Button size="sm">Browse Services</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          <Link href="/customer/bookings">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Start exploring services and book your first service
              </p>
              <Link href="/customer/services">
                <Button>Browse Services</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recentBookings.map((booking) => (
              <Card
                key={booking.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {booking.service?.name || "Unknown Service"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {booking.service?.provider?.businessName ||
                          "Unknown Provider"}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">
                        {booking.address?.street || ""},{" "}
                        {booking.address?.city || ""}
                      </span>
                    </div>
                    {booking.totalPrice && (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          ₹{booking.totalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Featured Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Featured Services</h2>
          <Link href="/customer/services">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {featuredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No services available
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Check back later as new providers are joining
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all cursor-pointer gap-0"
                onClick={() => router.push(`/customer/services/${service.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {service.provider?.businessName}
                      </p>
                    </div>
                    {service.provider?.isVerified && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/20"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {(service.provider?.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({service.provider?.totalReviews || 0} reviews)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{service.price}</p>
                      <p className="text-xs text-muted-foreground">
                        per service
                      </p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    Book Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-indigo-200/50 dark:border-indigo-800/50">
        <CardContent className="py-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-md">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Verified Providers</h3>
                <p className="text-sm text-muted-foreground">
                  All providers are verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-md">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Expert Professionals</h3>
                <p className="text-sm text-muted-foreground">
                  Skilled & experienced team
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-md">
                <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Best Prices</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive market rates
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
