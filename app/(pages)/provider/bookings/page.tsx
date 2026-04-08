"use client";
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  Loader2,
  Calendar,
  CalendarDays,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  AlertTriangle,
  Package,
  History as HistoryIcon,
  Image as ImageIcon,
  Info,
  RotateCcw,
  IndianRupee,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Check,
  X,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness } from "@/lib/provider/api";
import type { ProviderBooking } from "@/types/provider";
import type { Business } from "@/types/provider";
import {
  useProviderBookings,
  useCompleteBooking,
  useBookingStats,
} from "@/lib/queries/use-provider-bookings";
import { ProviderRescheduleDialog } from "@/components/provider/bookings/ProviderRescheduleDialog";
import { ServiceCompletionDialog } from "@/components/provider/bookings/ServiceCompletionDialog";
import { ImageLightbox, DataTablePagination } from "@/components/common";
import { BookingHistoryTimeline } from "@/components/customer/bookings/BookingHistoryTimeline";
import {
  ProviderBookingsSkeleton,
  ProviderBookingsTableSkeleton,
} from "@/components/provider/skeletons";

export default function ProviderBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Show full skeleton only on first render before any data
  const [showFullSkeleton, setShowFullSkeleton] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "all" | "confirmed" | "completed" | "cancelled"
  >("all");

  // TanStack Query hooks
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useProviderBookings({
    status: activeTab === "all" ? undefined : activeTab,
    page: currentPage,
    limit: pageSize,
  });
  const completeBooking = useCompleteBooking();

  const bookings = bookingsData?.bookings || [];

  // Fetch overall stats separately (without status filter - always shows total counts)
  const { data: overallBookingsData } = useProviderBookings({
    status: undefined,
    page: 1,
    limit: 1000, // Large limit to get all bookings for stats
  });

  // Compute stats from overall bookings data (never changes with status filter)
  const overallBookings = overallBookingsData?.bookings || [];
  const stats = useBookingStats(overallBookings);

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

  // Hide full skeleton once we have data (cached or fresh)
  useEffect(() => {
    if (bookingsData) {
      setShowFullSkeleton(false);
    }
  }, [bookingsData]);

  // Local UI state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<ProviderBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [pendingExpandId, setPendingExpandId] = useState<number | null>(null);
  const [processedInitialParams, setProcessedInitialParams] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] =
    useState<ProviderBooking | null>(null);

  // Confirmation dialogs state - legacy complete dialog kept for fallback

  // New OTP-based completion dialog state
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedBookingForCompletion, setSelectedBookingForCompletion] =
    useState<ProviderBooking | null>(null);

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sync tab to URL
  const updateTab = (newTab: string) => {
    setActiveTab(newTab as any);
    setCurrentPage(1); // Reset to page 1 when tab changes
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
      if (["confirmed", "completed", "cancelled"].includes(bookingStatus)) {
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

  // Action handlers
  const handleCancelByProvider = async () => {
    if (!selectedBookingForCancel) return;
    try {
      setIsCancellingBooking(true);
      await apiRequest(
        `/provider/booking/${selectedBookingForCancel.id}/cancel`,
        {
          method: "DELETE",
          body: JSON.stringify({
            reason: cancelReason || "Cancelled by provider",
          }),
        },
      );
      toast.success("Booking cancelled. Full refund issued to customer.");
      setCancelDialogOpen(false);
      setSelectedBookingForCancel(null);
      setCancelReason("");
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to cancel booking");
    } finally {
      setIsCancellingBooking(false);
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
      confirmed:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
      cancelled:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons: Record<string, React.ReactNode> = {
      confirmed: <CheckCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
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
      <Badge
        className={variants[status] || variants.confirmed}
        variant="outline"
      >
        <span className="mr-1">{icons[status] || icons.confirmed}</span>
        {formatStatusText(status)}
      </Badge>
    );
  };

  // Helper to get provider earning breakdown
  const calculateProviderEarningBreakdown = (booking: ProviderBooking) => {
    const servicePrice = Number(booking.price || 0);

    // Use backend-calculated providerEarning if available
    if (
      booking.providerEarning !== undefined &&
      booking.providerEarning !== null
    ) {
      const totalEarning = Number(booking.providerEarning) / 100; // Convert paise to rupees

      // Calculate reschedule fee portion
      let rescheduleFee = 0;
      const hasCustomerRescheduleFee =
        booking.rescheduleCount && booking.rescheduleCount > 0;
      const isRescheduleAccepted =
        booking.rescheduleOutcome === "accepted" ||
        booking.status === "completed" ||
        booking.status === "confirmed";

      if (hasCustomerRescheduleFee && isRescheduleAccepted) {
        rescheduleFee = (booking.rescheduleCount || 0) * 100;
      }

      const baseEarning = totalEarning - rescheduleFee;

      return {
        baseEarning,
        rescheduleFee,
        cancellationPayout: booking.providerPayoutAmount
          ? Number(booking.providerPayoutAmount)
          : 0,
        total: totalEarning,
        servicePrice,
      };
    }

    // Fallback calculation for bookings without providerEarning (old data)
    let baseEarning = 0;
    let rescheduleFee = 0;
    let cancellationPayout = 0;

    const hasCustomerRescheduleFee =
      booking.rescheduleCount && booking.rescheduleCount > 0;
    const isRescheduleAccepted =
      booking.rescheduleOutcome === "accepted" ||
      booking.status === "completed" ||
      booking.status === "confirmed";

    if (hasCustomerRescheduleFee && isRescheduleAccepted) {
      rescheduleFee = (booking.rescheduleCount || 0) * 100;
    }

    if (
      booking.providerPayoutAmount !== undefined &&
      booking.providerPayoutAmount !== null
    ) {
      cancellationPayout = Number(booking.providerPayoutAmount);
      baseEarning = cancellationPayout;
    } else if (booking.status === "cancelled") {
      baseEarning = 0;
    } else {
      // Fallback for old bookings without providerEarning set
      // New bookings have providerEarning from backend based on provider's plan
      baseEarning = Math.round(servicePrice * 0.95); // Assumes Premium (95%)
    }

    const total = baseEarning + rescheduleFee;

    return {
      baseEarning,
      rescheduleFee,
      cancellationPayout,
      total,
      servicePrice,
    };
  };

  // Helper to get total provider earning (for quick display)
  const calculateProviderEarning = (booking: ProviderBooking) => {
    // Use backend-calculated value if available, otherwise fallback
    return booking.providerEarning !== undefined &&
      booking.providerEarning !== null
      ? Number(booking.providerEarning) / 100
      : calculateProviderEarningBreakdown(booking).total;
  };

  // Enhanced status badge that shows primary status and details in a popover
  const getStatusBadgeWithRefund = (booking: ProviderBooking) => {
    const primaryBadge = getStatusBadge(booking.status);
    const secondaryBadges: React.ReactNode[] = [];

    // 1. Provider reschedule info (informational only, fee is shown in payout breakdown)
    const hasCustomerRescheduleFee =
      booking.rescheduleCount && booking.rescheduleCount > 0;

    // Show provider reschedule badge if provider was the last to reschedule
    if (booking.rescheduledBy === "provider" && hasCustomerRescheduleFee) {
      // Customer paid fee, then provider rescheduled (free)
      secondaryBadges.push(
        <Badge
          variant="outline"
          className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          key="provider-reschedule"
        >
          <CalendarDays className="h-2.5 w-2.5 shrink-0 mr-1.5" />
          <span className="truncate">
            Provider also rescheduled (no extra fee)
          </span>
        </Badge>,
      );
    } else if (
      booking.rescheduledBy === "provider" &&
      !hasCustomerRescheduleFee
    ) {
      // Only provider rescheduled, no customer fee
      secondaryBadges.push(
        <Badge
          variant="outline"
          className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          key="provider-reschedule"
        >
          <CalendarDays className="h-2.5 w-2.5 shrink-0 mr-1.5" />
          <span className="truncate">Rescheduled by provider (no fee)</span>
        </Badge>,
      );
    }

    // Show refund badge if customer's reschedule was rejected
    if (
      (booking.rescheduleOutcome === "rejected" ||
        booking.rescheduleOutcome === "cancelled") &&
      hasCustomerRescheduleFee
    ) {
      const refundedCount = booking.rescheduleCount || 1;
      secondaryBadges.push(
        <Badge
          variant="outline"
          className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          key="reschedule-refund"
        >
          <RotateCcw className="h-2.5 w-2.5 shrink-0 mr-1.5" />
          <span className="truncate">
            ₹{refundedCount * 100} refunded to customer
          </span>
        </Badge>,
      );
    }

    // 2. Payout breakdown for cancellations/completions/confirmed
    if (["confirmed", "completed", "cancelled"].includes(booking.status)) {
      const breakdown = calculateProviderEarningBreakdown(booking);

      // Base earning badge
      if (breakdown.baseEarning > 0) {
        const earningLabel =
          booking.status === "cancelled"
            ? `Payout: ₹${breakdown.baseEarning}`
            : `Earning: ₹${breakdown.baseEarning}`;

        secondaryBadges.push(
          <Badge
            variant="outline"
            className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
            key="base-earning"
          >
            <IndianRupee className="h-2.5 w-2.5 shrink-0 mr-1.5" />
            <span className="truncate">{earningLabel}</span>
          </Badge>,
        );
      }

      // Platform fee badge (show if backend provides it)
      if (
        booking.platformFee !== undefined &&
        booking.platformFee !== null &&
        booking.platformFee > 0
      ) {
        secondaryBadges.push(
          <Badge
            variant="outline"
            className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
            key="platform-fee"
          >
            <IndianRupee className="h-2.5 w-2.5 shrink-0 mr-1.5" />
            <span className="truncate">
              Platform fee: ₹{Number(booking.platformFee) / 100}
            </span>
          </Badge>,
        );
      }

      // Reschedule fee badge (if any)
      if (breakdown.rescheduleFee > 0) {
        secondaryBadges.push(
          <Badge
            variant="outline"
            className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
            key="reschedule-fee-earning"
          >
            <HistoryIcon className="h-2.5 w-2.5 shrink-0 mr-1.5" />
            <span className="truncate">
              Reschedule fee: ₹{breakdown.rescheduleFee}
            </span>
          </Badge>,
        );
      }

      // Total payout badge (if multiple components)
      if (breakdown.baseEarning > 0 && breakdown.rescheduleFee > 0) {
        secondaryBadges.push(
          <Badge
            variant="outline"
            className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-gradient-to-r from-emerald-50 to-purple-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-purple-900/20 dark:text-emerald-400 dark:border-emerald-800 font-semibold"
            key="total-payout"
          >
            <IndianRupee className="h-2.5 w-2.5 shrink-0 mr-1.5" />
            <span className="truncate">Total: ₹{breakdown.total}</span>
          </Badge>,
        );
      }

      // Zero payout badge
      if (breakdown.total === 0) {
        secondaryBadges.push(
          <Badge
            variant="outline"
            className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
            key="zero-payout"
          >
            <IndianRupee className="h-2.5 w-2.5 shrink-0 mr-1.5" />
            <span className="truncate">Your payout: ₹0</span>
          </Badge>,
        );
      }
    }

    // 3. General Refund to Customer
    if (
      (booking.status === "cancelled" || booking.status === "rejected") &&
      booking.isRefunded &&
      !secondaryBadges.some((b) => (b as any).key === "reschedule-refund")
    ) {
      secondaryBadges.push(
        <Badge
          variant="outline"
          className="text-[10px] w-full justify-start px-1.5 py-0.5 h-6 bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
          key="refund"
        >
          <RotateCcw className="h-2.5 w-2.5 shrink-0 mr-1.5" />
          <span className="truncate">Refunded to customer</span>
        </Badge>,
      );
    }

    if (secondaryBadges.length === 0) {
      return primaryBadge;
    }

    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {primaryBadge}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-muted text-muted-foreground p-0 transition-colors"
              title="Click for details"
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Summary
              </p>
              <div className="flex flex-col gap-2">{secondaryBadges}</div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
    const isCompleting =
      completeBooking.isPending && completeBooking.variables === booking.id;

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
            disabled={isCompleting}
            className="gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {isCompleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Complete
          </Button>
          {/* Cancel Booking button for provider */}
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBookingForCancel(booking);
              setCancelDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <X className="h-3 w-3" />
            Cancel Booking
          </Button>
        </div>
      );
    }

    return null;
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
  };

  const filteredBookings = getFilteredBookings();

  // Show full skeleton only on initial page load
  if (showFullSkeleton) {
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
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your confirmed & completed bookings
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

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.confirmed}
                </p>
                <p className="text-xs text-purple-700/70 dark:text-purple-400/70">
                  Confirmed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
            <TabsTrigger value="confirmed" className="whitespace-nowrap">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Completed
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">
              Cancelled
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop: Grid layout tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full max-w-xl grid-cols-4 h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
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
        <ProviderBookingsTableSkeleton />
      ) : filteredBookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-4">
              <Calendar className="h-7 w-7 text-blue-400 dark:text-blue-500" />
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
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 hover:bg-primary/5 dark:bg-primary/10 dark:hover:bg-primary/10">
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

                      {/* Price/Earning Column */}
                      <TableCell className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end gap-0.5 font-bold text-sm">
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground line-through font-normal">
                            <IndianRupee className="h-2.5 w-2.5" />
                            <span>{booking.price || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-bold tabular-nums">
                              {booking.providerEarning !== undefined &&
                              booking.providerEarning !== null
                                ? Number(booking.providerEarning) / 100
                                : calculateProviderEarning(booking)}
                            </span>
                          </div>
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
                                {/* Reschedule History - Show for ALL bookings with reschedule outcome */}
                                {/* {booking.rescheduleOutcome &&
                                  booking.previousSlotId && (
                                    <div className="bg-background/50 rounded-md p-5 border">
                                      <div className="flex items-center gap-2 pb-3 border-b">
                                        <HistoryIcon className="h-4 w-4 text-muted-foreground" />
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
                                            <ChevronRight className="h-4 w-4 text-purple-600" />
                                          </div>
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="text-muted-foreground">
                                              {booking.rescheduleOutcome ===
                                              "pending"
                                                ? "Requested:"
                                                : booking.rescheduleOutcome ===
                                                    "accepted"
                                                  ? "Confirmed:"
                                                  : booking.rescheduleOutcome ===
                                                      "rejected"
                                                    ? "Declined (reverted):"
                                                    : "Cancelled (reverted):"}
                                            </span>
                                            <span className="font-medium">
                                              {formatDate(
                                                booking.bookingDate ||
                                                  booking.date,
                                              )}{" "}
                                              at {formatTime(booking.startTime)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {booking.rescheduleOutcome ===
                                            "pending" &&
                                            "Customer's reschedule request - awaiting your approval"}
                                          {booking.rescheduleOutcome ===
                                            "accepted" &&
                                            "You approved this reschedule request"}
                                          {booking.rescheduleOutcome ===
                                            "rejected" &&
                                            "You declined this request - refunded to customer"}
                                          {booking.rescheduleOutcome ===
                                            "cancelled" &&
                                            "Customer cancelled their reschedule request"}
                                        </div>
                                      </div>
                                    </div>
                                  )} */}

                                {/* Recently Rescheduled Info (moved to left column) */}
                                {booking.status === "confirmed" &&
                                  booking.previousBookingDate && (
                                    <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-4 border border-purple-200 dark:border-purple-800">
                                      <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                                        <HistoryIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                                          Recently Rescheduled
                                        </h4>
                                      </div>
                                      <div className="mt-3 space-y-3">
                                        <div className="bg-white dark:bg-purple-950/40 rounded-md p-3 border border-purple-200 dark:border-purple-700">
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
                                                  booking.bookingDate ||
                                                    booking.date,
                                                )}{" "}
                                                at{" "}
                                                {formatTime(
                                                  booking.startTime || "",
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {booking.rescheduleReason && (
                                          <div>
                                            <label className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                              Reason
                                            </label>
                                            <p className="text-sm text-purple-900 dark:text-purple-100 mt-1">
                                              {booking.rescheduleReason}
                                            </p>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded px-2 py-1">
                                          <IndianRupee className="h-3 w-3" />
                                          <span>
                                            Customer paid ₹100 reschedule fee
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                {/* Cancellation Details (moved to left column) */}
                                {booking.status === "cancelled" && (
                                  <div className="bg-red-50/50 dark:bg-red-950/20 rounded-md p-4 border border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2 pb-2 border-b border-red-200 dark:border-red-800">
                                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                      <h4 className="font-semibold text-sm text-red-900 dark:text-red-100 uppercase tracking-tight">
                                        Cancellation Details
                                      </h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                      <div>
                                        <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                          Cancelled By
                                        </label>
                                        <Badge
                                          variant="outline"
                                          className="bg-red-100/50 text-red-700 border-red-200 capitalize py-0 px-2 h-5 text-[10px] font-bold mt-1"
                                        >
                                          {booking.cancelledBy || "System"}
                                        </Badge>
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                          Customer Refund
                                        </label>
                                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                          ₹{booking.refundAmount || "0"}
                                        </p>
                                      </div>
                                    </div>
                                    {booking.cancellationReason && (
                                      <div className="mt-3 pt-3 border-t border-red-100/50 dark:border-red-900/30">
                                        <label className="text-[10px] font-bold text-red-800/60 dark:text-red-400/60 uppercase tracking-widest">
                                          Reason
                                        </label>
                                        <p className="text-sm text-red-900 dark:text-red-100 italic bg-red-100/30 dark:bg-red-900/20 p-2 rounded-sm border-l-2 border-red-400 mt-1">
                                          "
                                          {booking.cancellationReason ||
                                            "No reason provided"}
                                          "
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Completion Photos (if available) */}
                              {(booking.beforePhotoUrl ||
                                booking.afterPhotoUrl) && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-md p-5 border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 pb-3 border-b border-green-200 dark:border-green-800">
                                    <ImageIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
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
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
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
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
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
                            </div>

                            {/* RIGHT COLUMN: Service & Actions */}
                            <div className="space-y-4">
                              {/* Service Information */}
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-md p-5 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2 pb-3 border-b border-blue-200 dark:border-blue-800">
                                  <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                                    Service Information
                                  </h4>
                                </div>
                                <div className="space-y-3 mt-4">
                                  <div>
                                    <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                      Service Name
                                    </label>
                                    <p className="font-semibold text-base mt-1 text-blue-900 dark:text-blue-100">
                                      {booking.serviceName || "Unknown Service"}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                        Service Price
                                      </label>
                                      <p className="font-semibold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-1 mt-1">
                                        <IndianRupee className="h-4 w-4" />
                                        {booking.price || 0}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                        Duration
                                      </label>
                                      <p className="font-medium text-sm mt-1 text-blue-800 dark:text-blue-200">
                                        ~1 hour
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Payment & Earnings */}
                              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-md p-5 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center gap-2 pb-3 border-b border-emerald-200 dark:border-emerald-800">
                                  <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                                    Payment & Earnings
                                  </h4>
                                </div>
                                <div className="space-y-4 mt-4">
                                  {/* Summary Card */}
                                  <div className="bg-white dark:bg-emerald-950/40 rounded-lg p-4 border border-emerald-100 dark:border-emerald-700">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                          Your Total Earning
                                        </p>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                          <IndianRupee className="h-6 w-6" />
                                          {(() => {
                                            const breakdown =
                                              calculateProviderEarningBreakdown(
                                                booking,
                                              );
                                            return breakdown.total;
                                          })()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                          {booking.status === "cancelled"
                                            ? "After cancellation"
                                            : booking.status === "completed"
                                              ? "Completed earning"
                                              : "Confirmed earning"}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className={`mt-1 ${
                                            booking.status === "confirmed"
                                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                              : booking.status === "completed"
                                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                                : "bg-gray-100 text-gray-700 border-gray-200"
                                          }`}
                                        >
                                          {booking.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Breakdown Details */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                                      Breakdown
                                    </p>
                                    <div className="space-y-2">
                                      {/* Service Price (crossed out) */}
                                      <div className="flex items-center justify-between text-sm text-muted-foreground line-through">
                                        <span>Service Price</span>
                                        <span className="flex items-center gap-1">
                                          <IndianRupee className="h-3 w-3" />
                                          {booking.price || 0}
                                        </span>
                                      </div>

                                      {/* Platform Fee */}
                                      {booking.platformFee &&
                                        booking.platformFee > 0 && (
                                          <div className="flex items-center justify-between text-sm text-orange-600 dark:text-orange-400">
                                            <span>Platform Fee</span>
                                            <span className="flex items-center gap-1">
                                              <IndianRupee className="h-3 w-3" />
                                              -
                                              {Number(booking.platformFee) /
                                                100}
                                            </span>
                                          </div>
                                        )}

                                      {/* Cancellation Deduction (if cancelled) */}
                                      {booking.status === "cancelled" &&
                                        booking.refundAmount && (
                                          <div className="flex items-center justify-between text-sm text-red-600 dark:text-red-400">
                                            <span>Customer Refund</span>
                                            <span className="flex items-center gap-1">
                                              <IndianRupee className="h-3 w-3" />
                                              -{booking.refundAmount}
                                            </span>
                                          </div>
                                        )}

                                      {/* Reschedule Fee (if any) */}
                                      {(() => {
                                        const breakdown =
                                          calculateProviderEarningBreakdown(
                                            booking,
                                          );
                                        if (breakdown.rescheduleFee > 0) {
                                          return (
                                            <div className="flex items-center justify-between text-sm text-purple-600 dark:text-purple-400">
                                              <span>
                                                Reschedule Fee{" "}
                                                {booking.rescheduleCount &&
                                                booking.rescheduleCount > 1
                                                  ? `(×${booking.rescheduleCount})`
                                                  : ""}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                +
                                                <IndianRupee className="h-3 w-3" />
                                                {breakdown.rescheduleFee}
                                              </span>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}

                                      {/* Your Share */}
                                      <div className="flex items-center justify-between text-sm font-semibold text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                                        <span>Your Share</span>
                                        <span className="flex items-center gap-1">
                                          <IndianRupee className="h-4 w-4" />
                                          {(() => {
                                            const breakdown =
                                              calculateProviderEarningBreakdown(
                                                booking,
                                              );
                                            return breakdown.total;
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Note */}
                                  <p className="text-[10px] text-muted-foreground italic">
                                    {booking.status === "cancelled"
                                      ? "* Customer cancelled. Reschedule fees are retained as per policy."
                                      : `* Platform fee calculated based on your subscription plan.`}
                                  </p>
                                </div>
                              </div>

                              {/* Customer Review (if completed) */}
                              {booking.status === "completed" &&
                                booking.feedback && (
                                  <div className="bg-background/50 rounded-md p-5 border">
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
                                          &quot;{booking.feedback.comments}
                                          &quot;
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
                                  <div className="bg-background/50 rounded-md p-5 border">
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

                          {/* Booking History Timeline */}
                          <div className="mt-6 pt-5 border-t">
                            <h4 className="font-semibold text-base mb-4 flex items-center gap-2">
                              <HistoryIcon className="h-5 w-5 text-primary" />
                              Booking Timeline
                            </h4>
                            <BookingHistoryTimeline
                              bookingId={booking.id}
                              refreshKey={dataUpdatedAt}
                            />
                          </div>

                          {/* Quick Actions - Full Action Buttons */}
                          <div className="mt-6 pt-5 border-t flex justify-end">
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
            date:
              selectedBookingForCompletion.bookingDate ||
              selectedBookingForCompletion.date,
            startTime: selectedBookingForCompletion.startTime,
          }}
          onSuccess={handleCompletionSuccess}
        />
      )}

      {/* Cancel Booking Dialog (Provider) */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Booking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the booking and issue a{" "}
              <strong>100% full refund</strong> to the customer automatically.
              <br />
              <br />
              Please provide a reason for the cancellation:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <textarea
              className="w-full border rounded-md p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="e.g. Emergency situation, unable to provide the service..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingBooking}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelByProvider}
              disabled={isCancellingBooking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancellingBooking ? (
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
