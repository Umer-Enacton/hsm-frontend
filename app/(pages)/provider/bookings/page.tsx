"use client";
import React from "react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api";
import {
  Loader2,
  Calendar,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  AlertTriangle,
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
  History as HistoryIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness } from "@/lib/provider/api";
import type { ProviderBooking } from "@/types/provider";
import type { Business } from "@/types/provider";
import {
  useProviderBookings,
  useAcceptBooking,
  useRejectBooking,
  useCompleteBooking,
  useBookingStats,
} from "@/lib/queries/use-provider-bookings";
import { ProviderBookingsSkeleton } from "@/components/provider/skeletons/ProviderBookingsSkeleton";
import { ReschedulePendingActions } from "@/components/provider/bookings/ReschedulePendingActions";
import { ProviderRescheduleDialog } from "@/components/provider/bookings/ProviderRescheduleDialog";
import { ServiceCompletionDialog } from "@/components/provider/bookings/ServiceCompletionDialog";

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  reschedulePending: number;
  completed: number;
  cancelled: number;
  rejected: number;
}

export default function ProviderBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // TanStack Query hooks
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProviderBookings();
  const acceptBooking = useAcceptBooking();
  const rejectBooking = useRejectBooking();
  const completeBooking = useCompleteBooking();

  // Compute stats from bookings data
  const stats = useBookingStats(bookings);

  // Business state for payment details check
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      const userData = getUserData();
      if (userData) {
        const businessData = await getProviderBusiness(userData.id);
        setBusiness(businessData);
      }
    };
    fetchBusiness();
  }, []);

  // Local UI state
  const [activeTab, setActiveTab] = useState<
    | "all"
    | "pending"
    | "confirmed"
    | "reschedule_pending"
    | "completed"
    | "cancelled"
    | "rejected"
  >("all");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [pendingExpandId, setPendingExpandId] = useState<number | null>(null);
  const [processedInitialParams, setProcessedInitialParams] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] =
    useState<ProviderBooking | null>(null);

  // Confirmation dialogs state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null,
  );

  // New OTP-based completion dialog state
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedBookingForCompletion, setSelectedBookingForCompletion] =
    useState<ProviderBooking | null>(null);

  // Sync tab to URL
  const updateTab = (newTab: string) => {
    setActiveTab(newTab as any);
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    router.replace(`/provider/bookings?${params.toString()}`, {
      scroll: false,
    });
  };

  // Find booking by ID and switch to its tab + expand
  const switchToBookingTabAndExpand = (bookingId: number) => {
    // Find the booking in the already-loaded bookings
    const booking = bookings.find((b) => b.id === bookingId);

    if (booking) {
      const bookingStatus = booking.status;
      console.log("📋 Found booking in loaded data:", {
        bookingId,
        bookingStatus,
      });

      // Switch to the tab based on booking's status
      if (
        [
          "pending",
          "confirmed",
          "reschedule_pending",
          "completed",
          "cancelled",
          "rejected",
        ].includes(bookingStatus)
      ) {
        updateTab(bookingStatus);
        // Store for expansion after tab switch
        setPendingExpandId(bookingId);
      } else {
        // If status is unknown or "all", just expand in current tab
        setExpandedRowId(bookingId);
      }
    } else {
      console.warn("⚠️ Booking not found in loaded data:", bookingId);
      // Still expand even if not found
      setExpandedRowId(bookingId);
    }
  };

  // Handle URL query params on mount
  useEffect(() => {
    if (processedInitialParams) return;

    const expandParam = searchParams.get("expand");

    if (expandParam) {
      const bookingId = parseInt(expandParam, 10);
      if (!isNaN(bookingId) && !isLoading) {
        // Wait for bookings to load, then find and switch tab
        switchToBookingTabAndExpand(bookingId);
      }
    }

    setProcessedInitialParams(true);
  }, [isLoading, bookings]);

  // Expand booking after tab switch - watches activeTab and pendingExpandId
  useEffect(() => {
    if (pendingExpandId && !isLoading) {
      // Get filtered bookings for current tab
      const filteredBookings =
        activeTab === "all"
          ? bookings
          : bookings.filter((b) => b.status === activeTab);

      const bookingInFiltered = filteredBookings.some(
        (b) => b.id === pendingExpandId,
      );

      console.log("🔍 Checking expand after tab switch:", {
        pendingExpandId,
        activeTab,
        filteredCount: filteredBookings.length,
        bookingInFiltered,
      });

      if (bookingInFiltered) {
        // Found the booking in filtered list - expand it!
        setExpandedRowId(pendingExpandId);
        setPendingExpandId(null);
        console.log(
          "✅ Expanded booking:",
          pendingExpandId,
          "in tab:",
          activeTab,
        );
      }
    }
  }, [activeTab, pendingExpandId, isLoading, bookings]);

  // Listen for custom event when already on page
  useEffect(() => {
    const handleNotificationClick = (
      event: CustomEvent<{ expand?: number }>,
    ) => {
      const { expand } = event.detail;
      if (expand) {
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
  }, [bookings, isLoading]);

  // Action handlers using mutations with confirmation dialogs
  const handleAccept = () => {
    if (selectedBookingId !== null) {
      acceptBooking.mutate(selectedBookingId);
      setAcceptDialogOpen(false);
      setSelectedBookingId(null);
    }
  };

  const handleReject = () => {
    if (selectedBookingId !== null) {
      rejectBooking.mutate(selectedBookingId);
      setRejectDialogOpen(false);
      setSelectedBookingId(null);
    }
  };

  const handleComplete = () => {
    if (selectedBookingId !== null) {
      completeBooking.mutate(selectedBookingId);
      setCompleteDialogOpen(false);
      setSelectedBookingId(null);
    }
  };

  // New OTP-based completion handler
  const handleOpenCompletionDialog = (booking: ProviderBooking) => {
    setSelectedBookingForCompletion(booking);
    setCompletionDialogOpen(true);
  };

  const handleCompletionSuccess = () => {
    // Refresh bookings after successful completion
    setExpandedRowId(null);
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
      reschedule_pending:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
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
      reschedule_pending: <HistoryIcon className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
    };

    // Format status text for display
    const formatStatusText = (s: string) => {
      const statusMap: Record<string, string> = {
        reschedule_pending: "Reschedule Pending",
      };
      return (
        statusMap[s] ||
        s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ")
      );
    };

    return (
      <Badge className={variants[status] || variants.pending} variant="outline">
        <span className="mr-1">{icons[status] || icons.pending}</span>
        {formatStatusText(status)}
      </Badge>
    );
  };

  // Enhanced status badge that shows refund indicator and provider payout
  const getStatusBadgeWithRefund = (booking: ProviderBooking) => {
    const baseBadge = getStatusBadge(booking.status);

    // Show reschedule fee badge for bookings with reschedule outcome
    if (booking.rescheduleOutcome) {
      if (
        booking.rescheduleOutcome === "pending" ||
        booking.rescheduleOutcome === "accepted"
      ) {
        return (
          <div className="flex flex-col gap-1">
            {baseBadge}
            <Badge
              variant="outline"
              className="text-xs px-2 py-0 h-6 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
            >
              <HistoryIcon className="h-2.5 w-2.5 mr-1" />
              Customer paid ₹100 reschedule fee
            </Badge>
          </div>
        );
      }
      if (
        booking.rescheduleOutcome === "rejected" ||
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
              ₹100 refunded to customer
            </Badge>
          </div>
        );
      }
    }

    // Show payout amount for cancelled bookings where provider received their share (15%)
    if (booking.status === "cancelled" && booking.providerPayoutAmount) {
      // Convert from paise to rupees if needed
      const payoutAmount =
        booking.providerPayoutAmount > 100
          ? Math.round(booking.providerPayoutAmount / 100)
          : booking.providerPayoutAmount;

      return (
        <div className="flex flex-col gap-1">
          {baseBadge}
          <Badge
            variant="outline"
            className="text-xs px-2 py-0 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          >
            <IndianRupee className="h-2.5 w-2.5 mr-1" />
            You received: ₹{payoutAmount}
          </Badge>
        </div>
      );
    }

    // For rejected bookings (by provider), show refunded to customer
    if (
      (booking.status === "cancelled" || booking.status === "rejected") &&
      booking.isRefunded
    ) {
      return (
        <div className="flex flex-col gap-1">
          {baseBadge}
          <Badge
            variant="outline"
            className="text-xs px-2 py-0 h-6 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
          >
            <RotateCcw className="h-2.5 w-2.5 mr-1" />
            Refunded to customer
          </Badge>
        </div>
      );
    }

    return baseBadge;
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
    // Use mutation loading states
    const isAccepting =
      acceptBooking.isPending && acceptBooking.variables === booking.id;
    const isRejecting =
      rejectBooking.isPending && rejectBooking.variables === booking.id;
    const isCompleting =
      completeBooking.isPending && completeBooking.variables === booking.id;
    const isLoading = isAccepting || isRejecting || isCompleting;

    // Reschedule pending - show approve/decline buttons
    if (booking.status === "reschedule_pending") {
      return (
        <ReschedulePendingActions
          bookingId={booking.id}
          rescheduleReason={booking.rescheduleReason || null}
          newDate={
            booking.rescheduleBookingDate ||
            booking.bookingDate ||
            booking.date ||
            ""
          }
          newTime={formatTime(booking.rescheduleSlotTime || booking.startTime)}
          previousDate={
            booking.previousBookingDate
              ? formatDate(booking.previousBookingDate)
              : null
          }
          previousTime={
            booking.previousSlotTime
              ? formatTime(booking.previousSlotTime)
              : null
          }
          onActionComplete={refetch}
          variant="expanded"
        />
      );
    }

    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBookingId(booking.id);
              setAcceptDialogOpen(true);
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
              setSelectedBookingId(booking.id);
              setRejectDialogOpen(true);
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
        <div className="flex gap-2">
          {/* Reschedule button */}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBookingForReschedule(booking);
              setRescheduleDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <CalendarDays className="h-3 w-3" />
            Reschedule
          </Button>
          {/* Complete button - Uses new OTP-based completion dialog */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenCompletionDialog(booking);
            }}
            disabled={isLoading}
            className="gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Complete
          </Button>
        </div>
      );
    }

    return null;
  };

  const getBookingStatus = () => {
    if (isLoading) return "loading";
    if (bookings.length === 0) return "empty";
    return "has-data";
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
  };

  const filteredBookings = getFilteredBookings();

  // Show skeleton on initial load
  if (isLoading) {
    return <ProviderBookingsSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
            <XCircle className="h-7 w-7 text-destructive/40" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Bookings</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {error instanceof Error
              ? error.message
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
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
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

      {/* Payment Details Warning */}
      {business && !business.hasPaymentDetails && (
        <Alert
          variant="destructive"
          className="border-orange-500 bg-orange-50 dark:bg-orange-950/40"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <strong className="block mb-1">Payment Details Required</strong>
                You must add payment details (UPI ID or Bank Account) to receive
                bookings and earnings. Without payment details, customers cannot
                book your services.
              </div>
              <Link href="/provider/payments">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Add Payment Details
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => updateTab(v)}>
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="md:hidden overflow-x-auto pb-2 -mb-2">
          <TabsList className="inline-flex w-full min-w-max gap-1 h-10">
            <TabsTrigger value="all" className="whitespace-nowrap">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">
              Pending
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="whitespace-nowrap">
              Confirmed
            </TabsTrigger>
            <TabsTrigger
              value="reschedule_pending"
              className="whitespace-nowrap"
            >
              Reschedule
              {stats.reschedulePending > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.reschedulePending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">
              Cancelled
            </TabsTrigger>
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
                              <AvatarImage
                                src={booking.customerAvatar || undefined}
                                alt={booking.customerName}
                              />
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
                        {getStatusBadgeWithRefund(booking)}
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
                                  <AvatarImage
                                    src={booking.customerAvatar || undefined}
                                    alt={booking.customerName}
                                  />
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
                              {/* Reschedule Request Info (for reschedule_pending) */}
                              {booking.status === "reschedule_pending" && (
                                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                                  <div className="flex items-center gap-2 pb-3 border-b border-purple-200 dark:border-purple-800">
                                    <HistoryIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                      Reschedule Re quest
                                    </h4>
                                  </div>
                                  <div className="mt-4 space-y-4">
                                    {/* Slot Comparison - Previous → New */}
                                    {booking.previousBookingDate && (
                                      <div className="bg-white dark:bg-purple-950/40 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                        <label className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                          Schedule Change
                                        </label>
                                        <div className="flex items-center gap-3 mt-2">
                                          <div className="flex-1">
                                            <div className="text-xs text-muted-foreground mb-1">
                                              From:
                                            </div>
                                            <div className="text-sm">
                                              {formatDate(
                                                booking.previousBookingDate,
                                              )}
                                              {booking.previousSlotTime && (
                                                <span>
                                                  {" "}
                                                  at{" "}
                                                  {formatTime(
                                                    booking.previousSlotTime,
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <ChevronRight className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                          <div className="flex-1">
                                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
                                              To:
                                            </div>
                                            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                              {formatDate(
                                                booking.rescheduleBookingDate ||
                                                  booking.bookingDate ||
                                                  booking.date,
                                              )}{" "}
                                              at{" "}
                                              {formatTime(
                                                booking.rescheduleSlotTime ||
                                                  booking.startTime ||
                                                  "",
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Reason */}
                                    {booking.rescheduleReason && (
                                      <div>
                                        <label className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                          Reason
                                        </label>
                                        <p className="text-sm text-purple-900 dark:text-purple-100 mt-1 leading-relaxed">
                                          {booking.rescheduleReason}
                                        </p>
                                      </div>
                                    )}

                                    {/* Fee Info */}
                                    <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded px-2 py-1">
                                      <IndianRupee className="h-3 w-3" />
                                      <span>
                                        Customer paid ₹100 reschedule fee
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

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

                              {/* Reschedule History - Show for ALL bookings with reschedule outcome */}
                              {booking.rescheduleOutcome && booking.previousSlotId && (
                                <div className="bg-background/50 rounded-xl p-5 border">
                                  <div className="flex items-center gap-2 pb-3 border-b">
                                    <HistoryIcon className="h-4 w-4 text-muted-foreground" />
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
                                        <ChevronRight className="h-4 w-4 text-purple-600" />
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">
                                          {booking.rescheduleOutcome === "pending" ? "Requested:" :
                                           booking.rescheduleOutcome === "accepted" ? "Confirmed:" :
                                           booking.rescheduleOutcome === "rejected" ? "Declined (reverted):" :
                                           "Cancelled (reverted):"}
                                        </span>
                                        <span className="font-medium">
                                          {formatDate(booking.bookingDate || booking.date)} at {formatTime(booking.startTime)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {booking.rescheduleOutcome === "pending" && "Customer's reschedule request - awaiting your approval"}
                                      {booking.rescheduleOutcome === "accepted" && "You approved this reschedule request"}
                                      {booking.rescheduleOutcome === "rejected" && "You declined this request - refunded to customer"}
                                      {booking.rescheduleOutcome === "cancelled" && "Customer cancelled their reschedule request"}
                                    </div>
                                  </div>
                                </div>
                              )}

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

      {/* Provider Reschedule Dialog */}
      {selectedBookingForReschedule && selectedBookingForReschedule.slotId && (
        <ProviderRescheduleDialog
          bookingId={selectedBookingForReschedule.id}
          businessId={
            selectedBookingForReschedule.businessProfileId ||
            selectedBookingForReschedule.businessId
          }
          serviceId={selectedBookingForReschedule.serviceId}
          currentSlotId={selectedBookingForReschedule.slotId}
          currentBookingDate={
            selectedBookingForReschedule.bookingDate ||
            selectedBookingForReschedule.date
          }
          onRescheduled={refetch}
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
        />
      )}

      {/* OTP-based Service Completion Dialog */}
      {selectedBookingForCompletion && (
        <ServiceCompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          booking={{
            id: selectedBookingForCompletion.id,
            serviceName: selectedBookingForCompletion.serviceName || "Service",
            customerName: selectedBookingForCompletion.customerName,
            date: selectedBookingForCompletion.bookingDate || selectedBookingForCompletion.date,
            startTime: selectedBookingForCompletion.startTime,
          }}
          onSuccess={handleCompletionSuccess}
        />
      )}

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Booking Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will confirm the booking and you will be expected to provide
              the service at the scheduled time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acceptBooking.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAccept}
              disabled={acceptBooking.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Booking Request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the booking request and the customer will receive
              a full refund.
              <br />
              <br />
              <strong>Note:</strong> Once rejected, the customer cannot rebook
              the same slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectBooking.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectBooking.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Booking as Complete?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that you have provided the service and the booking is
              complete.
              <br />
              <br />
              <strong>Note:</strong> The customer will be able to leave a review
              and rating after completion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completeBooking.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={completeBooking.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {completeBooking.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
