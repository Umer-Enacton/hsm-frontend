"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, Clock, Phone, User, Star, X, ChevronLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getBookingById, cancelBooking } from "@/lib/customer/api";
import type { CustomerBooking } from "@/types/customer";
import Link from "next/link";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // Unwrap the params Promise
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true);
      const bookingData = await getBookingById(parseInt(id));
      setBooking(bookingData);
    } catch (error: any) {
      console.error("Error loading booking:", error);
      toast.error("Failed to load booking details");
      router.push("/customer/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancelling(true);
      await cancelBooking(booking.id, "Customer cancelled");
      toast.success("Booking cancelled successfully");
      await loadBookingDetails();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />,
    };

    return {
      className: variants[status] || variants.pending,
      icon: icons[status] || icons.pending,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
  };

  const getTimelineItems = () => {
    if (!booking) return [];

    const items = [
      { label: "Booking Created", completed: true, icon: Calendar },
      { label: "Provider Confirmed", completed: booking.status !== "pending", icon: RefreshCw },
      { label: "Service Completed", completed: booking.status === "completed", icon: CheckCircle },
    ];

    return items;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Booking not found</p>
          <Link href="/customer/bookings">
            <Button>View All Bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(booking.status);
  const timelineItems = getTimelineItems();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/customer/bookings">
        <Button variant="ghost" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to My Bookings
        </Button>
      </Link>

      {/* Booking Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
          <p className="text-muted-foreground">Booking #{booking.id}</p>
        </div>
        <Badge className={statusBadge.className}>
          <span className="flex items-center gap-1">
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{booking.service.name}</h3>
                <p className="text-muted-foreground">{booking.provider.businessName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium">
                      {new Date(booking.bookingDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{booking.service.estimateDuration} mins</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₹{booking.totalPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Service Address</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.address.street},<br />
                    {booking.address.city}, {booking.address.state} {booking.address.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {timelineItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-2 ${
                        item.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {index < timelineItems.length - 1 && (
                        <div className={`w-0.5 h-full my-2 ${
                          item.completed ? "bg-primary" : "bg-muted"
                        }`} style={{ minHeight: "24px" }} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-medium ${item.completed ? "" : "text-muted-foreground"}`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle>Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{booking.provider.businessName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{booking.provider.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.provider.city}, {booking.provider.state}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.provider.phone}</span>
              </div>

              <Link href={`/customer/services/${booking.service.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Provider
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === "pending" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </>
                  )}
                </Button>
              )}

              {booking.status === "completed" && (
                <Link href={`/customer/reviews?booking=${booking.id}`}>
                  <Button className="w-full">
                    <Star className="h-4 w-4 mr-2" />
                    Leave Review
                  </Button>
                </Link>
              )}

              <Link href="/customer/bookings">
                <Button variant="outline" className="w-full">
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Contact our support team for any issues with your booking
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
