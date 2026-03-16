"use client";

import { useState } from "react";
import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  IndianRupee,
  Star,
  XCircle,
  RefreshCw,
  Package,
  Building2,
  History,
  Info,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BookingActions } from "@/components/customer/bookings/BookingActions";
import { CustomerBookingsSkeleton } from "@/components/customer/skeletons/CustomerBookingsSkeleton";
import { useBookings } from "@/lib/queries/use-bookings";
import { useService } from "@/lib/queries/use-services";
import type { CustomerBooking, Address, Slot, ServiceDetails } from "@/types/customer";

// Local types for UI-specific data structures
interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  reschedulePending: number;
  completed: number;
  cancelled: number;
  rejected: number;
}

// Type for nested service in CustomerBooking
type BookingService = CustomerBooking["service"];

export default function CustomerBookingsPage() {
  // Use React Query for bookings data
  const {
    data: bookingsData,
    isLoading,
    error: bookingsError,
    refetch: refetchBookings,
    isFetching: isRefreshing,
  } = useBookings();

  // Local state for UI-only concerns
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "confirmed" | "reschedule_pending" | "completed" | "cancelled" | "rejected"
  >("all");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const bookings = bookingsData?.bookings || [];
  const total = bookingsData?.total || 0;

  // Find the service ID of the expanded booking
  const expandedBooking = bookings.find((b) => b.id === expandedRowId);
  const expandedServiceId = expandedBooking?.serviceId;

  // Fetch full service details when a row is expanded
  const { data: fullServiceDetails, isLoading: isServiceLoading } = useService(
    expandedServiceId ?? 0
  );

  // Calculate stats from bookings data
  const stats: BookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    reschedulePending: bookings.filter((b) => b.status === "reschedule_pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  // Refresh function using query invalidation
  const handleRefresh = async () => {
    await refetchBookings();
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      payment_pending:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
      confirmed:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      reschedule_pending:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      cancelled:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      refunded:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
      rejected:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      payment_pending: <Clock className="h-3 w-3" />,
      confirmed: <Calendar className="h-3 w-3" />,
      reschedule_pending: <History className="h-3 w-3" />,
      completed: <Calendar className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      refunded: <RotateCcw className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
    };

    // Format status text for display
    const formatStatusText = (s: string) => {
      const statusMap: Record<string, string> = {
        reschedule_pending: "Reschedule Pending",
        payment_pending: "Payment Pending",
      };
      return statusMap[s] || s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
    };

    return (
      <Badge className={variants[status] || variants.pending} variant="outline">
        <span className="mr-1">{icons[status] || icons.pending}</span>
        {formatStatusText(status)}
      </Badge>
    );
  };

  // Enhanced status badge that shows refund indicator with amount
  const getStatusBadgeWithRefund = (booking: CustomerBooking) => {
    const baseBadge = getStatusBadge(booking.status);

    // Show reschedule fee badge for bookings with reschedule outcome
    if (booking.rescheduleOutcome) {
      if (booking.rescheduleOutcome === "pending" || booking.rescheduleOutcome === "accepted") {
        return (
          <div className="flex flex-col gap-1">
            {baseBadge}
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-6 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
            >
              <History className="h-2.5 w-2.5 mr-1" />
              Reschedule Fee: ₹100 paid
            </Badge>
          </div>
        );
      }
      if (booking.rescheduleOutcome === "rejected" || booking.rescheduleOutcome === "cancelled") {
        return (
          <div className="flex flex-col gap-1">
            {baseBadge}
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-6 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              <RotateCcw className="h-2.5 w-2.5 mr-1" />
              Reschedule Fee: ₹100 refunded
            </Badge>
          </div>
        );
      }
    }

    // Show refund indicator for cancelled or rejected bookings that were refunded
    if ((booking.status === "cancelled" || booking.status === "rejected") && booking.isRefunded) {
      // Get refund amount from booking.refundAmount or default to totalPrice
      const refundAmount = booking.refundAmount || booking.totalPrice;
      // Convert from paise to rupees if needed (check if amount looks like paise)
      const displayRefund = refundAmount > 10000 ? Math.round(refundAmount / 100) : refundAmount;

      return (
        <div className="flex flex-col gap-1">
          {baseBadge}
          <Badge
            variant="outline"
            className="text-xs px-2 py-0 h-6 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            <RotateCcw className="h-2.5 w-2.5 mr-1" />
            Refunded: ₹{displayRefund}
          </Badge>
        </div>
      );
    }

    return baseBadge;
  };

  // Get status-based tint color for expanded rows
  const getStatusRowTint = (status: string) => {
    const statusTints: Record<string, string> = {
      pending: "bg-amber-50/50 hover:bg-amber-50/50 dark:bg-amber-950/20",
      payment_pending:
        "bg-orange-50/50 hover:bg-orange-50/50 dark:bg-orange-950/20",
      confirmed: "bg-blue-50/50 hover:bg-blue-50/50 dark:bg-blue-950/20",
      reschedule_pending: "bg-purple-50/50 hover:bg-purple-50/50 dark:bg-purple-950/20",
      completed: "bg-green-50/50 hover:bg-green-50/50 dark:bg-green-950/20",
      cancelled: "bg-red-50/50 hover:bg-red-50/50 dark:bg-red-950/20",
      rejected: "bg-red-50/50 hover:bg-red-50/50 dark:bg-red-950/20",
      refunded: "bg-gray-50/50 hover:bg-gray-50/50 dark:bg-gray-950/20",
    };
    return statusTints[status] || statusTints.pending;
  };

  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRating = (rating: string | number | undefined): string => {
    if (rating === undefined || rating === null || rating === "") return "N/A";
    const num = typeof rating === "string" ? parseFloat(rating) : rating;
    return isNaN(num) ? "N/A" : num.toFixed(1);
  };

  const toggleRowExpand = (bookingId: number) => {
    setExpandedRowId(expandedRowId === bookingId ? null : bookingId);
  };

  if (isLoading) {
    return <CustomerBookingsSkeleton />;
  }

  if (bookingsError) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
            <XCircle className="h-7 w-7 text-destructive/40" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Bookings</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {bookingsError instanceof Error ? bookingsError.message : "Failed to load bookings. Please try again."}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredBookings = getFilteredBookings();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your service bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/customer/services">
            <Button variant="default" size="sm" className="whitespace-nowrap">
              Browse Services
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>
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
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
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
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="md:hidden overflow-x-auto pb-2 -mb-2">
          <TabsList className="inline-flex w-full min-w-max gap-1 h-10">
            <TabsTrigger value="all" className="whitespace-nowrap">All</TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">Pending</TabsTrigger>
            <TabsTrigger value="confirmed" className="whitespace-nowrap">Confirmed</TabsTrigger>
            <TabsTrigger value="reschedule_pending" className="whitespace-nowrap">
              Reschedule
              {stats.reschedulePending > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.reschedulePending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">Completed</TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">Cancelled</TabsTrigger>
            <TabsTrigger value="rejected" className="whitespace-nowrap">
              Rejected
              {stats.rejected > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.rejected}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop: Grid layout tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full max-w-4xl grid-cols-7 h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="reschedule_pending">
              Reschedule
              {stats.reschedulePending > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.reschedulePending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {stats.rejected > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.rejected}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
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
                ? "You haven't made any bookings yet. Browse our services to get started."
                : `You don't have any ${activeTab} bookings.`}
            </p>
            <Link href="/customer/services">
              <Button>Browse Services</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[1%] py-4 px-4"></TableHead>
                <TableHead className="w-[35%] py-4 px-4">Service</TableHead>
                <TableHead className="w-[25%] py-4 px-4">Provider</TableHead>
                <TableHead className="w-[20%] py-4 px-4">Date & Time</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[9%] py-4 px-4 text-right">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                const service = booking.service;
                const provider = service?.provider;

                const address = booking.address;
                const slot = booking.slot;
                const isExpanded = expandedRowId === booking.id;

                return (
                  <React.Fragment key={booking.id}>
                    {/* Main Row */}
                    <TableRow
                      className={cn(
                        "hover:bg-muted/50 transition-colors border-b last:border-b-0 cursor-pointer",
                        !service && "bg-muted/30",
                      )}
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

                      {/* Service Column */}
                      <TableCell className="py-4 px-4">
                        {service ? (
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {service.name}
                          </h3>
                        ) : (
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                        )}
                      </TableCell>

                      {/* Provider Column */}
                      <TableCell className="py-4 px-4">
                        {provider ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm line-clamp-1">
                                {provider.businessName}
                              </span>
                            </div>
                            {provider.isVerified && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 h-4"
                              >
                                Verified
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                        )}
                      </TableCell>

                      {/* Date & Time Column */}
                      <TableCell className="py-4 px-4">
                        {slot ? (
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">
                                {formatDate(booking.bookingDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {formatTime(slot.startTime)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                            <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                          </div>
                        )}
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="py-4 px-4">
                        {getStatusBadgeWithRefund(booking)}
                      </TableCell>

                      {/* Price Column */}
                      <TableCell className="py-4 px-4 text-right">
                        <div className="flex items-center gap-0.5 font-semibold text-sm justify-end">
                          <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                          <span>{booking.totalPrice}</span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row - New Two-Column Layout */}
                    {isExpanded && (
                      <TableRow
                        className={cn(
                          "border-b",
                          getStatusRowTint(booking.status),
                        )}
                      >
                        <TableCell colSpan={6} className="py-6 px-6 ">
                          {isServiceLoading ? (
                            // Skeleton while loading service details
                            <div className="grid lg:grid-cols-2 gap-8">
                              <div className="space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                  <Skeleton className="h-10 w-10 rounded-lg" />
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <div className="space-y-4 pl-1">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-3 w-full" />
                                  <Skeleton className="h-3 w-3/4" />
                                  <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-6">
                                <div className="bg-background/50 rounded-xl p-5 border space-y-3">
                                  <Skeleton className="h-4 w-28" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="bg-background/50 rounded-xl p-5 border space-y-3">
                                  <Skeleton className="h-4 w-28" />
                                  <div className="grid grid-cols-2 gap-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Actual content when loaded
                            <div className="grid lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Service Details (spans vertically) */}
                            {(service || fullServiceDetails) && (
                              <div className="space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-base">
                                      Service Details
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      Booking #{booking.id}
                                    </p>
                                  </div>
                                </div>

                                {/* Service Image - Use full service details if available */}
                                {(fullServiceDetails?.image || service?.imageUrl) ? (
                                  <div className="rounded-xl overflow-hidden border">
                                    <img
                                      src={fullServiceDetails?.image || service?.imageUrl || undefined}
                                      alt={fullServiceDetails?.name || service?.name || "Service"}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="rounded-xl h-48 bg-gradient-to-br from-muted/50 to-muted border flex items-center justify-center">
                                    <Package className="h-16 w-16 text-muted-foreground/30" />
                                  </div>
                                )}

                                <div className="space-y-4 pl-1">
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Service Name
                                    </label>
                                    <p className="font-medium text-sm mt-1">
                                      {fullServiceDetails?.name || service?.name}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Description
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                      {fullServiceDetails?.description || service?.description ||
                                        "No description available"}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Price
                                      </label>
                                      <p className="font-semibold text-base mt-1">
                                        <span className="flex items-center gap-1">
                                          <IndianRupee className="h-4 w-4" />
                                          {fullServiceDetails?.price || service?.price}
                                        </span>
                                      </p>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Duration
                                      </label>
                                      <p className="font-medium text-base mt-1">
                                        {fullServiceDetails?.estimateDuration || service?.duration || "N/A"} min
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Rating
                                      </label>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium text-base">
                                          {formatRating(fullServiceDetails?.rating || provider?.rating)}
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Reviews
                                      </label>
                                      <p className="font-medium text-base mt-1">
                                        {(fullServiceDetails?.totalReviews || provider?.totalReviews || 0)} reviews
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* RIGHT COLUMN: Split into two rows */}
                            <div className="space-y-6">
                              {/* Row 1: Provider Details */}
                              {(fullServiceDetails?.provider || provider) && (
                                <div className="bg-background/50 rounded-xl p-5 border">
                                  <div className="flex items-center gap-2 pb-3 border-b">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-semibold text-sm">
                                      Provider Details
                                    </h4>
                                  </div>
                                  <div className="space-y-3 mt-4">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Business Name
                                      </label>
                                      <p className="font-medium text-sm mt-1">
                                        {fullServiceDetails?.provider?.businessName || provider?.businessName}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Email
                                      </label>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {fullServiceDetails?.provider?.email || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Row 2: Booking Logistics */}
                              <div className="bg-background/50 rounded-xl p-5 border">
                                <div className="flex items-center gap-2 pb-3 border-b">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="font-semibold text-sm">
                                    Booking Logistics
                                  </h4>
                                </div>
                                <div className="space-y-3 mt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Booking ID
                                      </label>
                                      <p className="font-medium text-sm mt-1">
                                        #{booking.id}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Status
                                      </label>
                                      <div className="mt-1">
                                        {getStatusBadgeWithRefund(booking)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Date
                                      </label>
                                      <p className="text-sm mt-1">
                                        {formatDate(booking.bookingDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Time
                                      </label>
                                      <p className="text-sm mt-1">
                                        {slot
                                          ? formatTime(slot.startTime)
                                          : "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Reschedule Details - Show when rescheduleOutcome exists */}
                              {booking.rescheduleOutcome && booking.previousSlotId && (
                                <div className="bg-background/50 rounded-xl p-5 border">
                                  <div className="flex items-center gap-2 pb-3 border-b">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-semibold text-sm">
                                      Reschedule Details
                                    </h4>
                                  </div>
                                  <div className="space-y-3 mt-4">
                                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Previous:</span>
                                        <span className="font-medium">
                                          {booking.previousBookingDate ? formatDate(booking.previousBookingDate) : "N/A"}
                                          {booking.previousSlotTime && ` at ${formatTime(booking.previousSlotTime)}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-center my-1">
                                        <ChevronDown className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">
                                          {booking.rescheduleOutcome === "pending" ? "Requested:" :
                                           booking.rescheduleOutcome === "accepted" ? "Confirmed:" :
                                           booking.rescheduleOutcome === "rejected" ? "Declined (reverted):" :
                                           "Cancelled (reverted):"}
                                        </span>
                                        <span className="font-medium">
                                          {formatDate(booking.bookingDate)} at {slot ? formatTime(slot.startTime) : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {booking.rescheduleOutcome === "pending" && "Waiting for provider approval"}
                                      {booking.rescheduleOutcome === "accepted" && "Provider approved your reschedule request"}
                                      {booking.rescheduleOutcome === "rejected" && "Provider declined - refund initiated"}
                                      {booking.rescheduleOutcome === "cancelled" && "You cancelled the reschedule request"}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Address Details */}
                              {address && (
                                <div className="bg-background/50 rounded-xl p-5 border">
                                  <div className="flex items-center gap-2 pb-3 border-b">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="font-semibold text-sm">
                                      Service Address
                                    </h4>
                                  </div>
                                  <div className="space-y-2 mt-4 text-sm">
                                    <p className="font-medium">
                                      {address.street}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {address.city}, {address.state}{" "}
                                      {address.zipCode}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          )}

                          {/* Quick Actions - Using modular BookingActions component */}
                          <div className="mt-6 pt-5 border-t">
                            <BookingActions
                              booking={booking}
                              businessId={booking.businessProfileId}
                              serviceName={service?.name}
                              hasReviewed={!!booking.feedback}
                              onActionComplete={handleRefresh}
                              variant="expanded"
                            />
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
