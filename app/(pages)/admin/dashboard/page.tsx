"use client";

import { useEffect, useState } from "react";
import { Users, Wrench, Building2, DollarSign, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { AdminPageHeader, StatCard, LoadingState, ErrorState } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  verifiedBusinesses: number;
  pendingBusinesses: number;
  totalServices: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  revenue: number;
}

interface Activity {
  id: string;
  type: "user" | "booking" | "business" | "payment";
  message: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch users - handle different response formats
      const usersResponse: any = await api.get(API_ENDPOINTS.USERS);
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.users || usersResponse?.data || []);

      // Fetch businesses - handle different response formats
      const businessesResponse: any = await api.get(API_ENDPOINTS.BUSINESSES);
      const businesses = Array.isArray(businessesResponse) ? businessesResponse : (businessesResponse?.businesses || businessesResponse?.data || []);

      // Fetch services - handle different response formats
      const servicesResponse: any = await api.get(API_ENDPOINTS.SERVICES);
      const services = Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.services || servicesResponse?.data || []);

      // Calculate stats
      const totalUsers = users?.length || 0;
      const totalBusinesses = businesses?.length || 0;
      const verifiedBusinesses = businesses?.filter((b: any) => b.is_verified)?.length || 0;
      const pendingBusinesses = totalBusinesses - verifiedBusinesses;
      const totalServices = services?.length || 0;

      // For bookings and revenue, we'd need a dedicated admin endpoint
      // Using placeholder values for now
      const totalBookings = 0;
      const completedBookings = 0;
      const pendingBookings = 0;
      const revenue = 0;

      setStats({
        totalUsers,
        totalBusinesses,
        verifiedBusinesses,
        pendingBusinesses,
        totalServices,
        totalBookings,
        completedBookings,
        pendingBookings,
        revenue,
      });

      // Mock activity data - in production, this would come from an activity log endpoint
      setActivities([
        {
          id: "1",
          type: "user",
          message: "New user registration",
          timestamp: "2 minutes ago",
        },
        {
          id: "2",
          type: "booking",
          message: "Service booking completed",
          timestamp: "15 minutes ago",
        },
        {
          id: "3",
          type: "business",
          message: "New business application submitted",
          timestamp: "1 hour ago",
        },
        {
          id: "4",
          type: "payment",
          message: "Payment processed successfully",
          timestamp: "3 hours ago",
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change="+20.1% from last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Businesses"
          value={stats?.totalBusinesses || 0}
          change={`+${stats?.pendingBusinesses || 0} pending verification`}
          icon={Building2}
          trend="up"
        />
        <StatCard
          title="Total Services"
          value={stats?.totalServices || 0}
          change="+18.2% from last month"
          icon={Wrench}
          trend="up"
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          change={`${stats?.pendingBookings || 0} pending`}
          icon={Calendar}
          trend="neutral"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Verified Businesses"
          value={stats?.verifiedBusinesses || 0}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard
          title="Pending Verification"
          value={stats?.pendingBusinesses || 0}
          icon={Clock}
          trend="neutral"
        />
        <StatCard
          title="Revenue"
          value={`$${stats?.revenue?.toLocaleString() || "0"}`}
          change="+4.5% from last month"
          icon={DollarSign}
          trend="up"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 text-sm">
                  <div className={`h-2 w-2 rounded-full ${getActivityColor(activity.type)}`} />
                  <span className="flex-1">{activity.message}</span>
                  <span className="text-muted-foreground">{activity.timestamp}</span>
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
            <Button variant="outline" onClick={() => window.location.href = "/admin/users"}>
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/admin/business"}>
              <Building2 className="h-4 w-4 mr-2" />
              Verify Businesses
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/admin/categories"}>
              <Wrench className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/admin/bookings"}>
              <Calendar className="h-4 w-4 mr-2" />
              View Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
