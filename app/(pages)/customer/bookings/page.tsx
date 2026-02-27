"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BookingActions } from "@/components/customer/bookings/BookingActions";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  estimateDuration?: number;
  duration?: number;
  image?: string | null;
  rating?: string | number;
  totalReviews?: number;
  provider?: {
    id: number;
    businessName: string;
    avatar?: string | null;
    email?: string;
    phone?: string;
    isVerified?: boolean;
  };
}

interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  date: string;
}

interface CustomerBooking {
  id: number;
  serviceId: number;
  businessProfileId: number;
  addressId: number;
  slotId: number;
  bookingDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  totalPrice: number;
  createdAt: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [serviceCache, setServiceCache] = useState<Record<number, Service>>({});
  const [addressCache, setAddressCache] = useState<Record<number, Address>>({});
  const [slotCache, setSlotCache] = useState<Record<number, Slot>>({});
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

      const data: any = await api.get(API_ENDPOINTS.CUSTOMER_BOOKINGS);
      const bookingsArray = Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(bookingsArray);

      // Calculate stats
      const newStats: BookingStats = {
        total: bookingsArray.length,
        pending: bookingsArray.filter(
          (b: CustomerBooking) => b.status === "pending",
        ).length,
        confirmed: bookingsArray.filter(
          (b: CustomerBooking) => b.status === "confirmed",
        ).length,
        completed: bookingsArray.filter(
          (b: CustomerBooking) => b.status === "completed",
        ).length,
        cancelled: bookingsArray.filter(
          (b: CustomerBooking) =>
            b.status === "cancelled" || b.status === "rejected",
        ).length,
      };
      setStats(newStats);

      // Fetch details for each booking
      if (bookingsArray.length > 0) {
        await loadBookingDetails(bookingsArray);
      }
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadBookingDetails = async (bookingsList: CustomerBooking[]) => {
    try {
      // Get unique IDs
      const serviceIds = [...new Set(bookingsList.map((b) => b.serviceId))];
      const businessProfileIds = [
        ...new Set(bookingsList.map((b) => b.businessProfileId)),
      ];

      // Fetch service details
      const servicesPromises = serviceIds.map(async (serviceId) => {
        if (!serviceCache[serviceId]) {
          try {
            const service: any = await api.get(
              API_ENDPOINTS.SERVICE_BY_ID(serviceId),
            );
            return { id: serviceId, service };
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
            return { id: serviceId, service: null };
          }
        }
        return { id: serviceId, service: serviceCache[serviceId] };
      });

      // Fetch all addresses
      const addressesResult: any = await api.get(API_ENDPOINTS.ADDRESSES);
      const addressesArray = Array.isArray(addressesResult)
        ? addressesResult
        : [];

      // Create address cache
      const newAddressCache: Record<number, Address> = {};
      addressesArray.forEach((addr: Address) => {
        newAddressCache[addr.id] = addr;
      });
      setAddressCache(newAddressCache);

      // Fetch slots for each business
      const slotsPromises = businessProfileIds.map(async (businessId) => {
        try {
          const slots: any = await api.get(
            API_ENDPOINTS.SLOTS_PUBLIC(businessId),
          );
          return {
            businessId,
            slots: Array.isArray(slots) ? slots : slots?.slots || [],
          };
        } catch (error) {
          console.error(
            `Error loading slots for business ${businessId}:`,
            error,
          );
          return { businessId, slots: [] };
        }
      });

      // Wait for all parallel requests
      const [serviceResults, slotsResults] = await Promise.all([
        Promise.all(servicesPromises),
        Promise.all(slotsPromises),
      ]);

      // Update service cache
      const newServiceCache = { ...serviceCache };
      serviceResults.forEach(({ id, service }) => {
        if (service) {
          newServiceCache[id] = service;
        }
      });
      setServiceCache(newServiceCache);

      // Create slot cache
      const newSlotCache: Record<number, Slot> = { ...slotCache };
      slotsResults.forEach(({ slots }) => {
        slots.forEach((slot: Slot) => {
          newSlotCache[slot.id] = slot;
        });
      });
      setSlotCache(newSlotCache);
    } catch (error) {
      console.error("Error loading booking details:", error);
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
      confirmed:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
      completed:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      cancelled:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      rejected:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      confirmed: <Calendar className="h-3 w-3" />,
      completed: <Calendar className="h-3 w-3" />,
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
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your service bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/customer/services">
            <Button variant="default" size="sm">
              Browse Services
            </Button>
          </Link>
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
                const service = serviceCache[booking.serviceId];
                const provider = service?.provider;
                console.log("provider", provider);

                const address = addressCache[booking.addressId];
                const slot = slotCache[booking.slotId];
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
                          <div className="flex items-center gap-3">
                            {/* Service Image */}
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border flex items-center justify-center">
                              {service.image ? (
                                <img
                                  src={service.image}
                                  alt={service.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-primary/40" />
                              )}
                            </div>

                            {/* Service Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {service.name}
                              </h3>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">
                                  {formatRating(service.rating)}
                                </span>
                                {service.totalReviews &&
                                  service.totalReviews > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      ({service.totalReviews})
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                              <div className="h-3 bg-muted rounded w-1/2 animate-pulse mt-1" />
                            </div>
                          </div>
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
                        {getStatusBadge(booking.status)}
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
                      <TableRow className="bg-muted/30 border-b">
                        <TableCell colSpan={6} className="py-6 px-6">
                          <div className="grid lg:grid-cols-2 gap-8">
                            {/* LEFT COLUMN: Service Details (spans vertically) */}
                            {service && (
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

                                {/* Service Image */}
                                {service.image ? (
                                  <div className="rounded-xl overflow-hidden border">
                                    <img
                                      src={service.image}
                                      alt={service.name}
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
                                      {service.name}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      Description
                                    </label>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                      {service.description ||
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
                                          {service.price}
                                        </span>
                                      </p>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Duration
                                      </label>
                                      <p className="font-medium text-base mt-1">
                                        {service.estimateDuration ||
                                          service.duration ||
                                          "N/A"}{" "}
                                        min
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
                                          {formatRating(service.rating)}
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Reviews
                                      </label>
                                      <p className="font-medium text-base mt-1">
                                        {service.totalReviews || 0} reviews
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* RIGHT COLUMN: Split into two rows */}
                            <div className="space-y-6">
                              {/* Row 1: Provider Details */}
                              {provider && (
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
                                        {provider.businessName}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Email
                                      </label>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {provider.email || "N/A"}
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
                                        {getStatusBadge(booking.status)}
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
                                      {address.addressLine1}
                                    </p>
                                    {address.addressLine2 && (
                                      <p className="font-medium">
                                        {address.addressLine2}
                                      </p>
                                    )}
                                    <p className="text-muted-foreground">
                                      {address.city}, {address.state}{" "}
                                      {address.zipCode}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions - Using modular BookingActions component */}
                          <div className="mt-6 pt-5 border-t">
                            <BookingActions
                              booking={booking}
                              businessId={booking.businessProfileId}
                              serviceName={service?.name}
                              onActionComplete={() => loadBookings(true)}
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
