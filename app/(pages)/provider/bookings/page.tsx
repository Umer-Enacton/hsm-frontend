"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, MapPin, User, Phone, AlertCircle, Package, Check, X, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getProviderBookings,
  acceptBooking,
  rejectBooking,
  completeBooking,
} from "@/lib/provider/api";
import { cn } from "@/lib/utils";

interface ProviderBooking {
  id: number;
  customerId: number;
  businessId: number;
  serviceId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  price: number;
  date: string;
  bookingDate: string;
  startTime: string;
  address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  feedback?: {
    rating: number;
    comments?: string;
    createdAt: string;
  };
}

export default function ProviderBookingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      console.log("📡 Fetching provider bookings...");

      const data = await getProviderBookings();
      console.log("📦 Provider bookings response:", data);

      setBookings(data);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (bookingId: number) => {
    if (!confirm("Accept this booking request?")) return;

    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      await acceptBooking(bookingId);
      toast.success("Booking accepted");

      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: "confirmed" as const } : b)
      );
    } catch (error: any) {
      console.error("Error accepting booking:", error);
      toast.error(error.message || "Failed to accept booking");
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleReject = async (bookingId: number) => {
    if (!confirm("Reject this booking request?")) return;

    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      await rejectBooking(bookingId);
      toast.success("Booking rejected");

      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" as const } : b)
      );
    } catch (error: any) {
      console.error("Error rejecting booking:", error);
      toast.error(error.message || "Failed to reject booking");
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleComplete = async (bookingId: number) => {
    if (!confirm("Mark this booking as complete?")) return;

    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      await completeBooking(bookingId);
      toast.success("Booking completed");

      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: "completed" as const } : b)
      );
    } catch (error: any) {
      console.error("Error completing booking:", error);
      toast.error(error.message || "Failed to complete booking");
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
      rejected: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      confirmed: <CheckCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge className={variants[status] || variants.pending} variant="outline">
        <span className="mr-1">{icons[status] || icons.pending}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Invalid Date";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getActionButtons = (booking: ProviderBooking) => {
    const isLoading = actionLoading[booking.id];

    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAccept(booking.id);
            }}
            disabled={isLoading}
            className="gap-1.5 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleReject(booking.id);
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Reject
          </Button>
        </div>
      );
    }

    if (booking.status === "confirmed") {
      return (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleComplete(booking.id);
          }}
          disabled={isLoading}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Complete
        </Button>
      );
    }

    return null;
  };

  const getBookingStatus = () => {
    if (isLoading) return "loading";
    if (bookings.length === 0) return "empty";
    return "has-data";
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Booking Requests</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage incoming service bookings
                {bookings.length > 0 && (
                  <span className="ml-2 text-primary">
                    ({bookings.filter(b => b.status === "pending").length} pending)
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadBookings}>
              <Loader2 className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-5 h-10 bg-muted">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-background">
              Pending
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-background">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="data-[state=active]:bg-background">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {getBookingStatus() === "loading" && (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {getBookingStatus() === "empty" && (
          <Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {activeTab === "all"
                  ? "You don't have any bookings yet. When customers book your services, they'll appear here."
                  : `You don't have any ${activeTab} bookings.`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {getBookingStatus() === "has-data" && (
          <div className="grid gap-4 md:grid-cols-2">
            {getFilteredBookings().map((booking) => (
              <Card
                key={booking.id}
                className={cn(
                  "hover:shadow-md transition-all duration-200 border-border/50",
                  booking.status === "pending" && "border-l-4 border-l-yellow-500 shadow-sm"
                )}
              >
                <CardContent className="p-5">
                  {/* Header: Service Name & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                        {booking.serviceName || "Unknown Service"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-sm">{booking.customerName || "Unknown Customer"}</span>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(booking.bookingDate || booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatTime(booking.startTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{booking.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{booking.customerPhone || "No phone"}</span>
                    </div>

                    {/* Customer Review - Only for completed bookings with feedback */}
                    {booking.status === "completed" && booking.feedback && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Customer Review</span>
                          <div className="flex items-center gap-1 ml-auto">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= booking.feedback.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm font-semibold ml-1">{booking.feedback.rating}/5</span>
                          </div>
                        </div>
                        {booking.feedback.comments && (
                          <p className="text-sm text-muted-foreground italic line-clamp-2">
                            "{booking.feedback.comments}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Reviewed on {new Date(booking.feedback.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* No feedback yet message for completed bookings */}
                    {booking.status === "completed" && !booking.feedback && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>Waiting for customer review...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: Price & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-bold">₹{booking.price || booking.totalPrice || 0}</p>
                    </div>
                    {getActionButtons(booking)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results for Filter */}
        {getBookingStatus() === "has-data" && getFilteredBookings().length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {activeTab} bookings</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any {activeTab} bookings.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab("all")}
              >
                View All Bookings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
