"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Wrench,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Wallet,
  IndianRupee,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
} from "@/components/admin/shared";
import { AnalyticsSection } from "@/components/admin/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface DashboardStats {
  users: {
    total: number;
  };
  businesses: {
    total: number;
    verified: number;
    pending: number;
  };
  services: {
    total: number;
    active: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending: number;
  };
  revenue: {
    totalRevenue: number;
    platformFees: number;
    paymentCount: number;
  };
  payouts: {
    pendingAmount: number;
    pendingCount: number;
    minimumThreshold: number;
  };
}

interface Activity {
  id: string;
  type: "user" | "booking" | "business" | "payment";
  message: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInPaise / 100);
  };

  const fetchDashboardData = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Use the new dashboard stats endpoint
      const statsData: DashboardStats = await api.get(
        API_ENDPOINTS.ADMIN_DASHBOARD_STATS,
      );
      setStats(statsData);

      // Mock activity data for now
      setActivities([
        {
          id: "1",
          type: "booking",
          message: `${statsData.bookings.completed} bookings completed this month`,
          timestamp: "Today",
        },
        {
          id: "2",
          type: "payment",
          message: `${statsData.revenue.paymentCount} payments processed`,
          timestamp: "Today",
        },
        {
          id: "3",
          type: "business",
          message: `${statsData.businesses.pending} businesses pending verification`,
          timestamp: "This week",
        },
      ]);
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "user":
        return "bg-green-500";
      case "booking":
        return "bg-blue-500";
      case "business":
        return "bg-purple-500";
      case "payment":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={() => fetchDashboardData()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Dashboard"
        description="Welcome to the HSM Admin Dashboard. Monitor your platform at a glance."
        onRefresh={() => fetchDashboardData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Businesses"
          value={stats?.businesses.total || 0}
          change={`${stats?.businesses.pending || 0} pending`}
          icon={Building2}
          trend="up"
        />
        <StatCard
          title="Total Services"
          value={stats?.services.total || 0}
          change={`${stats?.services.active || 0} active`}
          icon={Wrench}
          trend="up"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.bookings.total || 0}
          change={`${stats?.bookings.completed || 0} completed`}
          icon={Calendar}
          trend="neutral"
        />
      </div>

      {/* Revenue Stats Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue.totalRevenue || 0)}
          icon={IndianRupee}
          trend="up"
          className="border-green-200 dark:border-green-800"
        />
        <StatCard
          title="Platform Fees"
          value={formatCurrency(stats?.revenue.platformFees || 0)}
          icon={DollarSign}
          trend="up"
          className="border-purple-200 dark:border-purple-800"
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(stats?.payouts.pendingAmount || 0)}
          change={`${stats?.payouts.pendingCount || 0} pending`}
          icon={Wallet}
          trend="neutral"
          className="border-orange-200 dark:border-orange-800"
        />
        <StatCard
          title="Min Payout"
          value={formatCurrency(stats?.payouts.minimumThreshold || 30000)}
          icon={Clock}
          trend="neutral"
        />
      </div>

      {/* Business Status */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2">
        <StatCard
          title="Verified Businesses"
          value={stats?.businesses.verified || 0}
          icon={CheckCircle}
          trend="up"
          className="border-emerald-200 dark:border-emerald-800"
        />
        <StatCard
          title="Pending Verification"
          value={stats?.businesses.pending || 0}
          icon={Clock}
          trend="neutral"
          className="border-amber-200 dark:border-amber-800"
        />
      </div>

      {/* Analytics Section with Charts */}
      <AnalyticsSection defaultPeriod="7d" />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 text-sm"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${getActivityColor(activity.type)}`}
                  />
                  <span className="flex-1">{activity.message}</span>
                  <span className="text-muted-foreground">
                    {activity.timestamp}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
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
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/business")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Verify Businesses
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/categories")}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/bookings")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/payouts")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Process Payouts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
