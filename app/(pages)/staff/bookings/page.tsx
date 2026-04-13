"use client";

import React, { useState, useEffect } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  MapPin,
  User,
  Phone,
  IndianRupee,
  Briefcase,
  RefreshCw,
  Package,
  Wallet,
  ChevronRight,
  ChevronDown,
  Mail,
  History,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ServiceCompletionDialog } from "@/components/provider/bookings/ServiceCompletionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Booking {
  id: number;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar?: string;
  businessAddress: string;
  bookingDate: string;
  slotStartTime: string;
  status: string;
  totalPrice: number;
  completionOtp?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  completionNotes?: string;
  staff_earning_type?: "commission" | "fixed" | null;
  staff_commission_percent?: number | null;
  staff_fixed_amount?: number | null;
  staff_earning?: number | null;
  assignedAt?: string;
}

interface BookingStats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  missed: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "confirmed" | "completed" | "cancelled" | "missed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Completion dialog state
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedBookingForCompletion, setSelectedBookingForCompletion] =
    useState<Booking | null>(null);

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsRefreshing(true);
    try {
      const response = await api.get<{ message: string; data: Booking[] }>(
        API_ENDPOINTS.BOOKING_STAFF_MY_BOOKINGS,
      );
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchBookings();
  };

  const handleOpenCompletionDialog = (booking: Booking) => {
    setSelectedBookingForCompletion(booking);
    setCompletionDialogOpen(true);
    setExpandedRowId(null);
  };

  const handleCompletionSuccess = () => {
    fetchBookings();
    setCompletionDialogOpen(false);
    setSelectedBookingForCompletion(null);
  };

  const toggleRowExpand = (bookingId: number) => {
    setExpandedRowId(expandedRowId === bookingId ? null : bookingId);
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.businessAddress?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && booking.status === activeTab;
  });

  // Calculate stats
  const stats: BookingStats = {
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    missed: bookings.filter((b) => b.status === "missed").length,
    totalEarnings: bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.staff_earning || 0), 0),
    pendingEarnings: bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => {
        if (
          b.staff_earning_type === "commission" &&
          b.staff_commission_percent
        ) {
          return (
            sum + Math.round((b.totalPrice * b.staff_commission_percent) / 100)
          );
        } else if (b.staff_earning_type === "fixed" && b.staff_fixed_amount) {
          return sum + b.staff_fixed_amount;
        }
        return sum;
      }, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "missed":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "reschedule_pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      case "missed":
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      reschedule_pending: "Reschedule Pending",
      missed: "Delayed",
    };
    return (
      statusMap[status] ||
      status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "--:--";
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const calculatePendingEarning = (booking: Booking) => {
    if (
      booking.staff_earning_type === "commission" &&
      booking.staff_commission_percent
    ) {
      return Math.round(
        (booking.totalPrice * booking.staff_commission_percent) / 100,
      );
    } else if (
      booking.staff_earning_type === "fixed" &&
      booking.staff_fixed_amount
    ) {
      return booking.staff_fixed_amount;
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your assigned bookings
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your assigned bookings
          </p>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Total Bookings */}
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

        {/* Confirmed */}
        <Card className="bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20 border-sky-200 dark:border-sky-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 dark:bg-sky-900/30">
                <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-sky-900 dark:text-sky-100">
                  {stats.confirmed}
                </p>
                <p className="text-xs text-sky-700/70 dark:text-sky-400/70">
                  Confirmed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
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

        {/* Missed/Delayed */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                <History className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats.missed}
                </p>
                <p className="text-xs text-orange-700/70 dark:text-orange-400/70">
                  Delayed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {(stats.totalEarnings / 100).toFixed(0)}
                </p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                  Total Earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs */}
      <Card>
        <CardContent className="pt-6">
          {/* Status Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            {/* Mobile: Horizontal scrollable tabs */}
            <div className="md:hidden overflow-x-auto pb-4 -mb-2">
              <TabsList className="inline-flex w-full min-w-max gap-1 h-10">
                <TabsTrigger value="all" className="whitespace-nowrap">
                  All
                  {stats.total > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="whitespace-nowrap">
                  Confirmed
                  {stats.confirmed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.confirmed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="whitespace-nowrap">
                  Completed
                  {stats.completed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.completed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="missed" className="whitespace-nowrap">
                  Delayed
                  {stats.missed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.missed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="whitespace-nowrap">
                  Cancelled
                  {stats.cancelled > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.cancelled}
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
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmed
                  {stats.confirmed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.confirmed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {stats.completed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.completed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="missed">
                  Delayed
                  {stats.missed > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.missed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Cancelled
                  {stats.cancelled > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {stats.cancelled}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, service, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="p-0">
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5 dark:bg-primary/10 dark:hover:bg-primary/10">
                  <TableHead className="w-[1%] py-4 px-4"></TableHead>
                  <TableHead className="w-[20%] py-4 px-4">Customer</TableHead>
                  <TableHead className="w-[25%] py-4 px-4">Service</TableHead>
                  <TableHead className="w-[20%] py-4 px-4">
                    Date & Time
                  </TableHead>
                  <TableHead className="w-[20%] py-4 px-4">Address</TableHead>
                  <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                  <TableHead className="w-[9%] py-4 px-4 text-right">
                    Earning
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          {searchTerm
                            ? "No bookings match your search"
                            : "No bookings found"}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                          {searchTerm
                            ? "Try adjusting your search terms"
                            : "You don't have any bookings assigned yet"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => {
                    const isExpanded = expandedRowId === booking.id;
                    const pendingEarning = calculatePendingEarning(booking);

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
                                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/5">
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
                                  {formatDate(booking.bookingDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {formatTime(booking.slotStartTime)}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Address Column */}
                          <TableCell className="py-4 px-4">
                            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">
                                {booking.businessAddress}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status Column */}
                          <TableCell className="py-4 px-4">
                            <Badge
                              className={getStatusColor(booking.status)}
                              variant="outline"
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(booking.status)}
                                {formatStatusText(booking.status)}
                              </span>
                            </Badge>
                          </TableCell>

                          {/* Earning Column */}
                          <TableCell className="py-4 px-4 text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              {booking.status === "confirmed" && (
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3" />
                                  {(pendingEarning / 100).toFixed(0)}
                                </div>
                              )}
                              {booking.status === "completed" &&
                                booking.staff_earning && (
                                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    {(booking.staff_earning / 100).toFixed(0)}
                                  </div>
                                )}
                              {booking.status === "completed" &&
                                !booking.staff_earning && (
                                  <div className="text-sm text-muted-foreground">
                                    --
                                  </div>
                                )}
                              <div className="text-[10px] text-muted-foreground">
                                {booking.status === "confirmed" && "Pending"}
                                {booking.status === "completed" && "Earned"}
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
                                        src={
                                          booking.customerAvatar || undefined
                                        }
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
                                        <a
                                          href={`tel:${booking.customerPhone}`}
                                          className="text-sm text-primary hover:underline"
                                        >
                                          {booking.customerPhone || "N/A"}
                                        </a>
                                      </div>
                                    </div>

                                    {booking.customerEmail && (
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                          Email
                                        </label>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Mail className="h-4 w-4 text-muted-foreground" />
                                          <p className="text-sm text-muted-foreground">
                                            {booking.customerEmail}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Service Address
                                      </label>
                                      <div className="flex items-start gap-2 mt-1">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-muted-foreground">
                                          {booking.businessAddress}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Completion Photos */}
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
                                            <div
                                              className="w-full h-32 bg-muted rounded-md bg-cover bg-center border cursor-pointer hover:opacity-90 transition-opacity"
                                              style={{
                                                backgroundImage: `url(${booking.beforePhotoUrl})`,
                                              }}
                                              onClick={() => {
                                                setLightboxImage(
                                                  booking.beforePhotoUrl!,
                                                );
                                                setLightboxOpen(true);
                                              }}
                                            />
                                          </div>
                                        )}
                                        {booking.afterPhotoUrl && (
                                          <div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              After
                                            </p>
                                            <div
                                              className="w-full h-32 bg-muted rounded-md bg-cover bg-center border cursor-pointer hover:opacity-90 transition-opacity"
                                              style={{
                                                backgroundImage: `url(${booking.afterPhotoUrl})`,
                                              }}
                                              onClick={() => {
                                                setLightboxImage(
                                                  booking.afterPhotoUrl!,
                                                );
                                                setLightboxOpen(true);
                                              }}
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
                                          {booking.serviceName ||
                                            "Unknown Service"}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                            Service Price
                                          </label>
                                          <p className="font-semibold text-lg text-blue-900 dark:text-blue-100 flex items-center gap-1 mt-1">
                                            <IndianRupee className="h-4 w-4" />
                                            {(booking.totalPrice / 100).toFixed(2)}
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

                                  {/* Earning Information */}
                                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-md p-5 border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 pb-3 border-b border-emerald-200 dark:border-emerald-800">
                                      <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                      <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                                        Your Earning
                                      </h4>
                                    </div>
                                    <div className="space-y-4 mt-4">
                                      {booking.status === "confirmed" && (
                                        <>
                                          <div className="bg-white dark:bg-emerald-950/40 rounded-lg p-4 border border-emerald-100 dark:border-emerald-700">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                  Pending Earning
                                                </p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                  <IndianRupee className="h-6 w-6" />
                                                  {(
                                                    pendingEarning / 100
                                                  ).toFixed(2)}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs text-muted-foreground">
                                                  Upon
                                                </p>
                                                <p className="text-sm font-medium">
                                                  Completion
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          {booking.staff_earning_type ===
                                            "commission" &&
                                            booking.staff_commission_percent && (
                                              <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                  Earning Type:
                                                </span>{" "}
                                                Commission (
                                                {
                                                  booking.staff_commission_percent
                                                }
                                                %)
                                              </div>
                                            )}
                                          {booking.staff_earning_type ===
                                            "fixed" &&
                                            booking.staff_fixed_amount && (
                                              <div className="text-sm text-muted-foreground">
                                                <span className="font-medium">
                                                  Earning Type:
                                                </span>{" "}
                                                Fixed Amount
                                              </div>
                                            )}
                                        </>
                                      )}

                                      {booking.status === "completed" && (
                                        <>
                                          {booking.staff_earning ? (
                                            <div className="bg-white dark:bg-emerald-950/40 rounded-lg p-4 border border-emerald-100 dark:border-emerald-700">
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                    You Earned
                                                  </p>
                                                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <IndianRupee className="h-6 w-6" />
                                                    {(
                                                      booking.staff_earning /
                                                      100
                                                    ).toFixed(2)}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                                    Completed
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="text-center py-4 text-muted-foreground">
                                              No earning recorded
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {booking.status === "cancelled" && (
                                        <div className="text-center py-4 text-muted-foreground">
                                          <XCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                                          <p>This booking was cancelled</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="mt-6 pt-5 border-t flex justify-end">
                                {booking.status === "confirmed" && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCompletionDialog(booking);
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* OTP-based Service Completion Dialog */}
      {selectedBookingForCompletion && (
        <ServiceCompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          booking={{
            id: selectedBookingForCompletion.id,
            serviceName: selectedBookingForCompletion.serviceName || "Service",
            customerName: selectedBookingForCompletion.customerName,
            date: selectedBookingForCompletion.bookingDate,
            startTime: selectedBookingForCompletion.slotStartTime,
          }}
          onSuccess={handleCompletionSuccess}
        />
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={lightboxImage}
              alt="Service photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <XCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
