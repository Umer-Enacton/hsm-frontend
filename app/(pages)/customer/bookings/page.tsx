"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle,
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
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { BookingActions } from "@/components/customer/bookings/BookingActions";
import { BookingHistoryTimeline } from "@/components/customer/bookings/BookingHistoryTimeline";
import {
  CustomerBookingsSkeleton,
  CustomerBookingsTableSkeleton,
} from "@/components/customer/skeletons";
import { useBookings } from "@/lib/queries/use-bookings";
import { useService } from "@/lib/queries/use-services";
import { type CustomerBooking, BookingStatus } from "@/types/customer";
import { ImageLightbox, DataTablePagination } from "@/components/common";

// Local types for UI-specific data structures
interface BookingStats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  missed: number;
}

export default function CustomerBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Local state for UI-only concerns (must be declared before hooks that use them)
  const [activeTab, setActiveTab] = useState<
    | "all"
    | BookingStatus.CONFIRMED
    | BookingStatus.COMPLETED
    | BookingStatus.CANCELLED
    | BookingStatus.MISSED
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [pendingExpandId, setPendingExpandId] = useState<number | null>(null);
  const [processedInitialParams, setProcessedInitialParams] = useState(false);

  // States to track navigation/refresh type for refined skeleton display
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Use React Query for bookings data with status filter
  const {
    data: bookingsData,
    isLoading,
    error: bookingsError,
    refetch: refetchBookings,
    isFetching: isRefreshing,
    dataUpdatedAt,
  } = useBookings({
    status: activeTab === "all" ? undefined : activeTab,
    pagination: { page: currentPage, limit: 10 },
  });

  // Drive skeleton visibility from query state for the initial page load
  const showFullSkeleton = isInitialLoading && isLoading;

  // Fetch overall stats separately (without status filter - always shows total counts)
  const { data: overallBookingsData } = useBookings({
    status: undefined,
    pagination: { page: 1, limit: 1000 }, // Large limit to get all bookings for stats
  });

  // Reset loading flags when data fetching finishes
  useEffect(() => {
    if (!isRefreshing && isInitialLoading) {
      setIsInitialLoading(false);
    }
  }, [isRefreshing, isInitialLoading]);

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sync tab to URL
  const updateTab = (newTab: string) => {
    setActiveTab(
      newTab as
        | "all"
        | BookingStatus.CONFIRMED
        | BookingStatus.COMPLETED
        | BookingStatus.CANCELLED
        | BookingStatus.MISSED,
    );
    setCurrentPage(1); // Reset page when tab changes
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    router.replace(`/customer/bookings?${params.toString()}`, {
      scroll: false,
    });
  };

  // Switch to the correct tab and expand booking (finds in loaded data, no API call)
  const switchToBookingTabAndExpand = (bookingId: number) => {
    const bookings = bookingsData?.bookings || [];
    const booking = bookings.find((b) => b.id === bookingId);

    console.log("🔍 Customer: switchToBookingTabAndExpand called", {
      bookingId,
      currentTab: activeTab,
      found: !!booking,
    });

    if (booking) {
      const bookingStatus = booking.status;
      console.log("📋 Customer booking status from loaded data:", {
        bookingId,
        bookingStatus,
      });

      if (
        ["confirmed", "completed", "cancelled", "missed"].includes(
          bookingStatus,
        )
      ) {
        if (activeTab === bookingStatus) {
          // Already on correct tab, expand directly
          console.log(
            "✅ Customer: Already on correct tab, expanding directly",
          );
          setExpandedRowId(bookingId);
          setPendingExpandId(null);
        } else {
          // Need to switch tab first
          console.log(
            "🔄 Customer: Switching tab from",
            activeTab,
            "to",
            bookingStatus,
          );
          updateTab(bookingStatus);
          // Will expand after tab change (watched by effect below)
          setPendingExpandId(bookingId);
        }
      } else {
        // Unknown status, just expand in current tab
        console.log("⚠️ Customer: Unknown status, expanding in current tab");
        setExpandedRowId(bookingId);
      }
    } else {
      // Booking not in loaded data, just expand (might be in different page/pagination)
      console.log("⚠️ Customer: Booking not in loaded data, expanding anyway");
      setExpandedRowId(bookingId);
    }
  };

  // Handle URL query params on mount
  useEffect(() => {
    if (processedInitialParams) return;

    const expandParam = searchParams.get("expand");
    console.log("📋 Customer: URL params effect", {
      expandParam,
      processedInitialParams,
    });

    if (expandParam) {
      const bookingId = parseInt(expandParam, 10);
      if (!isNaN(bookingId)) {
        console.log(
          "✅ Customer: Setting pendingExpandId from URL:",
          bookingId,
        );
        setPendingExpandId(bookingId);
      }
    }

    setProcessedInitialParams(true);
  }, [searchParams, processedInitialParams]);

  // Expand booking after data is loaded (for URL params on mount)
  useEffect(() => {
    if (!isLoading && pendingExpandId && processedInitialParams) {
      const bookings = bookingsData?.bookings || [];
      const bookingExists = bookings.some((b) => b.id === pendingExpandId);

      if (bookingExists) {
        console.log(
          "📋 Customer: Data loaded, calling switchToBookingTabAndExpand for:",
          pendingExpandId,
        );
        switchToBookingTabAndExpand(pendingExpandId);
        // DON'T clear pendingExpandId here - let tab switch watcher do it after tab changes
      } else {
        // Booking not in loaded data, just expand anyway
        console.log(
          "⚠️ Customer: Booking not found in loaded data:",
          pendingExpandId,
        );
        setExpandedRowId(pendingExpandId);
        setPendingExpandId(null);
      }
    }
  }, [isLoading, bookingsData, pendingExpandId, processedInitialParams]);

  // Listen for custom event when already on page (from notification click)
  useEffect(() => {
    const handleNotificationClick = (
      event: CustomEvent<{ expand?: number }>,
    ) => {
      const { expand } = event.detail;
      if (expand) {
        console.log(
          "📌 Customer: notification click event, bookingId:",
          expand,
        );
        switchToBookingTabAndExpand(expand);
      }
    };

    window.addEventListener(
      "booking-notification-click",
      handleNotificationClick as EventListener,
    );
    return () => {
      window.removeEventListener(
        "booking-notification-click",
        handleNotificationClick as EventListener,
      );
    };
  }, [bookingsData]); // Re-bind when bookings data changes

  // Expand booking after tab has changed (handles notification clicks within page)
  useEffect(() => {
    console.log("👀 Customer: Tab switch watcher running", {
      activeTab,
      pendingExpandId,
    });
    if (pendingExpandId && activeTab !== "all") {
      // Tab has changed from "all" to specific status tab, now expand
      setExpandedRowId(pendingExpandId);
      setPendingExpandId(null);
      console.log(
        "✅ Customer: Expanded booking after tab switch:",
        pendingExpandId,
        "in tab:",
        activeTab,
      );
    }
  }, [activeTab, pendingExpandId]);

  const bookings = bookingsData?.bookings || [];
  const overallBookings = overallBookingsData?.bookings || [];

  // Find the service ID of the expanded booking
  const expandedBooking = bookings.find((b) => b.id === expandedRowId);
  const expandedServiceId = expandedBooking?.serviceId;

  // Fetch full service details when a row is expanded
  const { data: fullServiceDetails, isLoading: isServiceLoading } = useService(
    expandedServiceId ?? 0,
  );

  // Calculate stats from overall bookings data (never changes with status filter)
  const stats: BookingStats = {
    total: overallBookings.length,
    confirmed: overallBookings.filter((b) => b.status === "confirmed").length,
    completed: overallBookings.filter((b) => b.status === "completed").length,
    cancelled: overallBookings.filter((b) => b.status === "cancelled").length,
    missed: overallBookings.filter((b) => b.status === "missed").length,
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
      confirmed:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      cancelled:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      missed:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    };

    const icons: Record<string, React.ReactNode> = {
      confirmed: <Calendar className="h-3 w-3" />,
      completed: <Calendar className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      missed: <Clock className="h-3 w-3" />,
    };

    // Format status text for display
    const formatStatusText = (s: string) => {
      const statusMap: Record<string, string> = {
        missed: "Delayed",
      };
      return (
        statusMap[s] ||
        s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
      );
    };

    return (
      <Badge
        className={variants[status] || variants.confirmed}
        variant="outline"
      >
        <span className="mr-1">{icons[status] || icons.confirmed}</span>
        {formatStatusText(status)}
      </Badge>
    );
  };

  // Enhanced status badge that shows refund indicator with amount
  const getStatusBadgeWithRefund = (booking: CustomerBooking) => {
    const baseBadge = getStatusBadge(booking.status);

    // Show reschedule fee badge for bookings with reschedule outcome
    if (booking.rescheduleOutcome) {
      if (
        booking.rescheduleOutcome === "cancelled"
      ) {
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

    // Show refund indicator for cancelled bookings that were refunded
    if (booking.status === "cancelled" && booking.isRefunded) {
      // Get refund amount from booking.refundAmount or default to totalPrice
      const refundAmount = booking.refundAmount || booking.totalPrice;
      // Convert from paise to rupees if needed (check if amount looks like paise)
      const displayRefund =
        refundAmount > 10000 ? Math.round(refundAmount / 100) : refundAmount;

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
      confirmed: "bg-blue-50/50 hover:bg-blue-50/50 dark:bg-blue-950/20",
      completed: "bg-green-50/50 hover:bg-green-50/50 dark:bg-green-950/20",
      cancelled: "bg-red-50/50 hover:bg-red-50/50 dark:bg-red-950/20",
    };
    return statusTints[status] || statusTints.confirmed;
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

  // Show full skeleton only on initial page load
  if (showFullSkeleton) {
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
            {bookingsError instanceof Error
              ? bookingsError.message
              : "Failed to load bookings. Please try again."}
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            My Bookings
          </h1>
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
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.total}
                </p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                  Total Bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.confirmed}
                </p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                  Confirmed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stats.cancelled}
                </p>
                <p className="text-xs text-red-700/70 dark:text-red-400/70">
                  Cancelled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats.completed}
                </p>
                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                  Completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => updateTab(v)}>
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="md:hidden overflow-x-auto pb-2 -mb-2">
          <TabsList className="inline-flex w-full min-w-max gap-1 h-10">
            <TabsTrigger value="all" className="whitespace-nowrap">
              All
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="whitespace-nowrap">
              Confirmed
              {stats.confirmed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.confirmed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Completed
              {stats.completed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.completed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">
              Cancelled
              {stats.cancelled > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.cancelled}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="missed" className="whitespace-nowrap">
              Delayed
              {stats.missed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.missed}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop: Grid layout tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 h-10">
            <TabsTrigger value="all">
              All
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed
              {stats.confirmed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.confirmed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              {stats.completed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.completed}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled
              {stats.cancelled > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.cancelled}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="missed">
              Delayed
              {stats.missed > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.missed}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredBookings.length}</span>{" "}
        of{" "}
        <span className="font-medium">
          {bookingsData?.pagination?.total || 0}
        </span>{" "}
        bookings
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <CustomerBookingsTableSkeleton />
      ) : filteredBookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-4">
              <Calendar className="h-7 w-7 text-blue-400 dark:text-blue-500" />
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
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 hover:bg-primary/5 dark:bg-primary/10 dark:hover:bg-primary/10">
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
                              <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
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
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                  <Skeleton className="h-8 w-8 rounded-md" />
                                  <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-2.5 w-20" />
                                  </div>
                                </div>
                                <div className="flex gap-3">
                                  <Skeleton className="w-20 h-20 rounded-md shrink-0" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-2.5 w-full" />
                                    <Skeleton className="h-2.5 w-2/3" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <Skeleton className="h-12 w-full rounded-md" />
                                  <Skeleton className="h-12 w-full rounded-md" />
                                  <Skeleton className="h-12 w-full rounded-md" />
                                  <Skeleton className="h-12 w-full rounded-md" />
                                </div>
                              </div>
                              <div className="space-y-6">
                                <div className="bg-background/50 rounded-md p-5 border space-y-3">
                                  <Skeleton className="h-4 w-28" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="bg-background/50 rounded-md p-5 border space-y-3">
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
                            <>
                              <div className="grid lg:grid-cols-2 gap-8">
                                {/* LEFT COLUMN: Service Details (compact) */}
                                {(service || fullServiceDetails) && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                        <Package className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <h3 className="font-semibold text-sm">
                                          Service Details
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                          Booking #{booking.id}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Compact: Service Name + Image side by side */}
                                    <div className="flex gap-3">
                                      {fullServiceDetails?.image ||
                                      service?.imageUrl ? (
                                        <div className="rounded-md overflow-hidden border shrink-0 relative w-20 h-20">
                                          <Image
                                            src={
                                              fullServiceDetails?.image ||
                                              service?.imageUrl ||
                                              "/placeholder-service.jpg"
                                            }
                                            alt={
                                              fullServiceDetails?.name ||
                                              service?.name ||
                                              "Service"
                                            }
                                            fill
                                            className="object-cover"
                                            unoptimized={
                                              !(
                                                fullServiceDetails?.image ||
                                                service?.imageUrl
                                              )?.includes("cloudinary")
                                            }
                                          />
                                        </div>
                                      ) : (
                                        <div className="rounded-md w-20 h-20 bg-gradient-to-br from-muted/50 to-muted border flex items-center justify-center shrink-0">
                                          <Package className="h-8 w-8 text-muted-foreground/30" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                          Service Name
                                        </label>
                                        <p className="font-medium text-md mt-0.5 truncate">
                                          {fullServiceDetails?.name ||
                                            service?.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {fullServiceDetails?.description ||
                                            service?.description ||
                                            "No description"}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Compact stats grid */}
                                    <div className="grid grid-cols-4 gap-2">
                                      <div className="bg-muted/30 rounded-md p-5 text-center">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                          Price
                                        </label>
                                        <p className="font-semibold text-sm flex items-center justify-center gap-0.5">
                                          <IndianRupee className="h-3 w-3" />
                                          {fullServiceDetails?.price ||
                                            service?.price}
                                        </p>
                                      </div>

                                      <div className="bg-muted/30 rounded-md p-5 text-center">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                          Duration
                                        </label>
                                        <p className="font-medium text-sm">
                                          {fullServiceDetails?.estimateDuration ||
                                            service?.duration ||
                                            "N/A"}
                                          m
                                        </p>
                                      </div>

                                      <div className="bg-muted/30 rounded-md p-5 text-center">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                          Rating
                                        </label>
                                        <p className="font-medium text-sm flex items-center justify-center gap-0.5">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          {formatRating(
                                            fullServiceDetails?.rating ||
                                              provider?.rating,
                                          )}
                                        </p>
                                      </div>

                                      <div className="bg-muted/30 rounded-md p-5 text-center">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block">
                                          Reviews
                                        </label>
                                        <p className="font-medium text-sm">
                                          {fullServiceDetails?.totalReviews ||
                                            provider?.totalReviews ||
                                            0}
                                        </p>
                                      </div>
                                    </div>
                                    {/* Address Details */}
                                    {address && (
                                      <div className="bg-background/50 rounded-md p-5 border">
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
                                )}

                                {/* RIGHT COLUMN: Split into two rows */}
                                <div className="space-y-6">
                                  {/* Row 1: Provider Details */}
                                  {(fullServiceDetails?.provider ||
                                    provider) && (
                                    <div className="bg-background/50 rounded-md p-5 border">
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
                                            {fullServiceDetails?.provider
                                              ?.businessName ||
                                              provider?.businessName}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Email
                                          </label>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            {fullServiceDetails?.provider
                                              ?.email || "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Row 2: Booking Logistics */}
                                  <div className="bg-background/50 rounded-md p-5 border">
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
                                  {booking.rescheduleOutcome &&
                                    booking.previousSlotId && (
                                      <div className="bg-background/50 rounded-md p-5 border">
                                        <div className="flex items-center gap-2 pb-3 border-b">
                                          <History className="h-4 w-4 text-muted-foreground" />
                                          <h4 className="font-semibold text-sm">
                                            Reschedule Details
                                          </h4>
                                        </div>
                                        <div className="space-y-3 mt-4">
                                          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-3">
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground">
                                                Previous:
                                              </span>
                                              <span className="font-medium">
                                                {booking.previousBookingDate
                                                  ? formatDate(
                                                      booking.previousBookingDate,
                                                    )
                                                  : "N/A"}
                                                {booking.previousSlotTime &&
                                                  ` at ${formatTime(booking.previousSlotTime)}`}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-center my-1">
                                              <ChevronDown className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <span className="text-muted-foreground">
                                                {booking.rescheduleOutcome ===
                                                "accepted"
                                                  ? "Confirmed:"
                                                  : "Cancelled (reverted):"}
                                              </span>
                                              <span className="font-medium">
                                                {formatDate(
                                                  booking.bookingDate,
                                                )}{" "}
                                                at{" "}
                                                {slot
                                                  ? formatTime(slot.startTime)
                                                  : "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {booking.rescheduleOutcome ===
                                              "accepted" &&
                                              "Provider approved your reschedule request"}
                                            {booking.rescheduleOutcome ===
                                              "cancelled" &&
                                              "You cancelled the reschedule request"}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Cancellation Details (if cancelled) */}
                              {booking.status === "cancelled" && (
                                <div className="bg-red-50/50 dark:bg-red-950/10 rounded-md p-5 border border-red-200 dark:border-red-800 mt-5">
                                  <div className="flex items-center gap-2 pb-3 border-b border-red-200 dark:border-red-800">
                                    <XCircle className="h-4 w-4 text-red-600 shadow-sm" />
                                    <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 uppercase tracking-tight">
                                      Cancellation Details
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                        Cancelled By
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-red-100/50 text-red-700 border-red-200 capitalize py-0 px-2 h-5 text-[10px] font-bold"
                                        >
                                          {booking.cancelledBy || "System"}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="space-y-1 sm:col-span-1">
                                      <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                        Refund Status
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                                          Refunded: ₹
                                          {booking.refundAmount || "0"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-1 sm:col-span-3 pt-2 mt-2 border-t border-red-100/50 dark:border-red-900/30">
                                      <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                        Reason
                                      </label>
                                      <p className="text-sm text-red-900 dark:text-red-100 italic leading-relaxed bg-red-100/30 dark:bg-red-900/20 p-2 rounded-sm border-l-2 border-red-400">
                                        &quot;
                                        {booking.cancellationReason ||
                                          "No reason provided"}
                                        &quot;
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Completion Photos (if available) */}
                              {(booking.beforePhotoUrl ||
                                booking.afterPhotoUrl) && (
                                <div className="bg-background/50 rounded-md p-5 border mt-5">
                                  <div className="flex items-center gap-2 pb-3 border-b ">
                                    <ImageIcon className="h-4 w-4  text-muted-foreground" />
                                    <h4 className="font-semibold text-sm">
                                      Service Photos
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                    {booking.beforePhotoUrl && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          Before
                                        </p>
                                        <Image
                                          src={booking.beforePhotoUrl}
                                          alt="Before service"
                                          width={300}
                                          height={128}
                                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => {
                                            setLightboxImage(
                                              booking.beforePhotoUrl!,
                                            );
                                            setLightboxOpen(true);
                                          }}
                                          unoptimized={
                                            !booking.beforePhotoUrl.includes(
                                              "cloudinary",
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                    {booking.afterPhotoUrl && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          After
                                        </p>
                                        <Image
                                          src={booking.afterPhotoUrl}
                                          alt="After service"
                                          width={300}
                                          height={128}
                                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => {
                                            setLightboxImage(
                                              booking.afterPhotoUrl!,
                                            );
                                            setLightboxOpen(true);
                                          }}
                                          unoptimized={
                                            !booking.afterPhotoUrl.includes(
                                              "cloudinary",
                                            )
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                  {booking.completionNotes && (
                                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                                      <p className="text-xs text-muted-foreground mb-1">
                                        Provider Notes:
                                      </p>
                                      <p className="text-sm text-green-900 dark:text-green-100">
                                        {booking.completionNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Booking History Timeline */}
                              <div className="mt-6 pt-5 border-t">
                                <BookingHistoryTimeline
                                  bookingId={booking.id}
                                  refreshKey={dataUpdatedAt}
                                />
                              </div>

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
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {bookingsData?.pagination && (
            <div className="border-t">
              <DataTablePagination
                currentPage={bookingsData.pagination.page}
                totalPages={bookingsData.pagination.totalPages}
                totalItems={bookingsData.pagination.total}
                pageSize={bookingsData.pagination.limit}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={lightboxImage}
        alt="Service photo"
      />
    </div>
  );
}
