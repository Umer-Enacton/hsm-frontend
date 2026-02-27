"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Calendar, MapPin, Star, Search, ChevronRight, Clock, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getCustomerBookings,
  getServices,
} from "@/lib/customer/api";
import type { CustomerBooking, CustomerService } from "@/types/customer";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<CustomerBooking[]>([]);
  const [featuredServices, setFeaturedServices] = useState<CustomerService[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent bookings (limit 3)
      const bookingsData = await getCustomerBookings({ limit: 3 });
      setRecentBookings(Array.isArray(bookingsData?.bookings) ? bookingsData.bookings.slice(0, 3) : []);

      // Calculate stats
      const allBookings = await getCustomerBookings();
      const bookingsList = Array.isArray(allBookings?.bookings) ? allBookings.bookings : [];
      setStats({
        totalBookings: allBookings?.total || 0,
        pendingBookings: bookingsList.filter((b) => b.status === "pending").length,
        completedBookings: bookingsList.filter((b) => b.status === "completed").length,
      });

      // Load featured services (verified providers, top rated)
      const servicesData = await getServices();
      // Sort by rating and take top 6
      const servicesList = Array.isArray(servicesData?.data) ? servicesData.data : [];
      const topServices = servicesList
        .filter((s) => s.provider?.rating)
        .sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0))
        .slice(0, 6);
      setFeaturedServices(topServices);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
      // Set empty defaults on error
      setRecentBookings([]);
      setStats({ totalBookings: 0, pendingBookings: 0, completedBookings: 0 });
      setFeaturedServices([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back! 👋</h1>
        <p className="text-muted-foreground">
          Find and book home services from verified providers
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
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
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{booking.service?.name || "Unknown Service"}</CardTitle>
                      <p className="text-sm text-muted-foreground">{booking.service?.provider?.businessName || "Unknown Provider"}</p>
                    </div>
                    <Badge className={getStatusBadgeColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="line-clamp-1">{booking.address?.street || ""}, {booking.address?.city || ""}</span>
                    </div>
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
              <h3 className="text-lg font-semibold mb-2">No services available</h3>
              <p className="text-sm text-muted-foreground text-center">
                Check back later as new providers are joining
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/customer/services/${service.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{service.provider.businessName}</p>
                    </div>
                    {service.provider.isVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20">
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
                      <span className="text-sm font-medium">{service.provider.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({service.provider.totalReviews} reviews)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{service.price}</p>
                      <p className="text-xs text-muted-foreground">per service</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4">Book Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
