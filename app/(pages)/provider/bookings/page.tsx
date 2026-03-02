"use client";
import React from "react";
import { useState, useEffect } from "react";
import {
  Loader2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Package,
  Check,
  X,
  Star,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Mail,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  customerAvatar?: string | null;
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

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function ProviderBookingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>(
    {},
  );
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "confirmed" | "completed" | "cancelled"
  >("all");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [stats, setStats] = useState<BookingStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      console.log("📡 Fetching provider bookings...");

      const data = await getProviderBookings();
      console.log("📦 Provider bookings response:", data);

      setBookings(data);

      // Calculate stats
      const newStats: BookingStats = {
        total: data.length,
        pending: data.filter((b: ProviderBooking) => b.status === "pending")
          .length,
        confirmed: data.filter((b: ProviderBooking) => b.status === "confirmed")
          .length,
        completed: data.filter((b: ProviderBooking) => b.status === "completed")
          .length,
        cancelled: data.filter(
          (b: ProviderBooking) =>
            b.status === "cancelled" || b.status === "rejected",
        ).length,
      };
      setStats(newStats);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAccept = async (bookingId: number) => {
    if (!confirm("Accept this booking request?")) return;

    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      await acceptBooking(bookingId);
      toast.success("Booking accepted");
      await loadBookings(true);
    } catch (error: any) {
      console.error("Error accepting booking:", error);
      toast.error(error.message || "Failed to accept booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleReject = async (bookingId: number) => {
    if (!confirm("Reject this booking request?")) return;

    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      await rejectBooking(bookingId);
      toast.success("Booking rejected");
      await loadBookings(true);
    } catch (error: any) {
      console.error("Error rejecting booking:", error);
      toast.error(error.message || "Failed to reject booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleComplete = async (bookingId: number) => {
    if (!confirm("Mark this booking as complete?")) return;

    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      await completeBooking(bookingId);
      toast.success("Booking completed");
      await loadBookings(true);
    } catch (error: any) {
      console.error("Error completing booking:", error);
      toast.error(error.message || "Failed to complete booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  };

  const toggleRowExpand = (bookingId: number) => {
    setExpandedRowId(expandedRowId === bookingId ? null : bookingId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
      cancelled:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
      rejected:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400",
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
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Invalid Date";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
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

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Booking Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming service bookings
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => loadBookings(true)}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-lg grid-cols-5 h-10">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredBookings.length}</span>{" "}
        of <span className="font-medium">{bookings.length}</span> bookings
      </div>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/30 mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {bookings.length === 0
                ? "You don't have any bookings yet. When customers book your services, they'll appear here."
                : `You don't have any ${activeTab} bookings.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[1%] py-4 px-4"></TableHead>
                <TableHead className="w-[20%] py-4 px-4">Customer</TableHead>
                <TableHead className="w-[25%] py-4 px-4">Service</TableHead>
                <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
                <TableHead className="w-[20%] py-4 px-4">Address</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[9%] py-4 px-4 text-right">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                const isLoading = actionLoading[booking.id];
                const isExpanded = expandedRowId === booking.id;

                return (
                  <React.Fragment key={booking.id}>
                    {/* Main Row */}
                    <TableRow
                      className="hover:bg-muted/50 transition-colors border-b last:border-b-0 cursor-pointer"
                      onClick={() => toggleRowExpand(booking.id)}
                    >
                      {/* Expand Chevron */}
                      <TableCell
                        className="py-4 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleRowExpand(booking.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>

                      {/* Customer Column */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={booking.customerAvatar || undefined} alt={booking.customerName} />
                              <AvatarFallback className="text-[10px]">
                                {booking.customerName
                                  ? booking.customerName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)
                                  : "UN"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {booking.customerName || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Service Column */}
                      <TableCell className="py-4 px-4">
                        <span className="font-medium text-sm">
                          {booking.serviceName || "Unknown Service"}
                        </span>
                      </TableCell>

                      {/* Date & Time Column */}
                      <TableCell className="py-4 px-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">
                              {formatDate(booking.bookingDate || booking.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {formatTime(booking.startTime)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Address Column */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {booking.address}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="py-4 px-4">
                        {getStatusBadge(booking.status)}
                      </TableCell>

                      {/* Price Column */}
                      <TableCell className="py-4 px-4 text-right">
                        <div className="flex items-center gap-0.5 font-semibold text-sm justify-end">
                          <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                          <span>{booking.price || 0}</span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30 border-b">
                        <TableCell colSpan={7} className="py-6 px-6">
                          <div className="grid lg:grid-cols-2 gap-6">
                            {/* LEFT COLUMN: Customer Details */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 pb-3 border-b">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={booking.customerAvatar || undefined} alt={booking.customerName} />
                                  <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                                    {booking.customerName
                                      ? booking.customerName
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)
                                      : "UN"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold text-base">
                                    Customer Details
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    Booking #{booking.id}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3 pl-1">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Name
                                  </label>
                                  <p className="font-medium text-sm mt-1">
                                    {booking.customerName || "N/A"}
                                  </p>
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Phone
                                  </label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm">
                                      {booking.customerPhone || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Email
                                  </label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                      {booking.customerEmail || "N/A"}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Service Address
                                  </label>
                                  <div className="flex items-start gap-2 mt-1">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-muted-foreground">
                                      {booking.address}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* RIGHT COLUMN: Service & Actions */}
                            <div className="space-y-4">
                              {/* Service Info */}
                              <div className="bg-background/50 rounded-xl p-5 border">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="font-semibold text-sm">
                                    Service Information
                                  </h4>
                                </div>
                                <div className="space-y-3 mt-4">
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Service Name
                                    </label>
                                    <p className="font-medium text-sm mt-1">
                                      {booking.serviceName || "Unknown Service"}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Price
                                    </label>
                                    <p className="font-semibold text-base mt-1 flex items-center gap-1">
                                      <IndianRupee className="h-4 w-4" />
                                      {booking.price || 0}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Customer Review (if completed) */}
                              {booking.status === "completed" &&
                                booking.feedback && (
                                  <div className="bg-background/50 rounded-xl p-5 border">
                                    <div className="flex items-center gap-2 pb-3 border-b">
                                      <MessageSquare className="h-4 w-4 text-primary" />
                                      <h4 className="font-semibold text-sm">
                                        Customer Review
                                      </h4>
                                    </div>
                                    <div className="mt-4">
                                      <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                              star <= booking.feedback!.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                        <span className="text-sm font-semibold ml-2">
                                          {booking.feedback!.rating}/5
                                        </span>
                                      </div>
                                      {booking.feedback.comments && (
                                        <p className="text-sm text-muted-foreground italic line-clamp-3">
                                          "{booking.feedback.comments}"
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Reviewed on{" "}
                                        {new Date(
                                          booking.feedback.createdAt,
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )}

                              {/* No feedback yet message for completed bookings */}
                              {booking.status === "completed" &&
                                !booking.feedback && (
                                  <div className="bg-background/50 rounded-xl p-5 border">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <MessageSquare className="h-4 w-4" />
                                      <span>
                                        Waiting for customer review...
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Quick Actions - Full Action Buttons */}
                          <div className="mt-6 pt-5 border-t">
                            {getActionButtons(booking)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
