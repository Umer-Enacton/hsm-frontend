"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getCustomerBookings, cancelBooking } from "@/lib/customer/api";
import type { CustomerBooking } from "@/types/customer";
import Link from "next/link";

export default function CustomerBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<CustomerBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await getCustomerBookings();
      setAllBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
      setAllBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancellingId(bookingId);
      await cancelBooking(bookingId);
      toast.success("Booking cancelled successfully");
      await loadBookings();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return allBookings;
    return allBookings.filter((b) => b.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      confirmed: <CheckCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
    };

    return {
      className: variants[status] || variants.pending,
      icon: icons[status] || icons.pending,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({allBookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({allBookings.filter(b => b.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({allBookings.filter(b => b.status === "confirmed").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({allBookings.filter(b => b.status === "completed").length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({allBookings.filter(b => b.status === "cancelled").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === "all" ? "No bookings yet" : `No ${activeTab} bookings`}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {activeTab === "all"
                    ? "Start exploring services and book your first service"
                    : `You don't have any ${activeTab} bookings`}
                </p>
                {activeTab === "all" && (
                  <Link href="/customer/services">
                    <Button>Browse Services</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredBookings.map((booking) => {
                const statusBadge = getStatusBadge(booking.status);
                return (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{booking.service.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {booking.provider.businessName}
                          </p>
                        </div>
                        <Badge className={statusBadge.className}>
                          <span className="flex items-center gap-1">
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date & Time</p>
                          <p className="font-medium">
                            {new Date(booking.bookingDate).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{booking.service?.estimateDuration || 0} mins</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-sm">Service Address</p>
                        <p className="text-sm">
                          {booking.address?.street || "N/A"}, {booking.address?.city || "N/A"}, {booking.address?.state || "N/A"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-lg font-bold">₹{booking.totalPrice}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/customer/bookings/${booking.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {booking.canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
