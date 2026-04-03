"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Calendar,
  Search,
  Filter,
  User,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingState,
  ErrorState,
  StatusBadge,
} from "@/components/admin/shared";
import { AdminBookingsSkeleton, AdminBookingsTableSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageLightbox, DataTablePagination } from "@/components/common";
import { BookingTimelineModal } from "@/components/admin/bookings/BookingTimelineModal";
import { History as HistoryIcon } from "lucide-react";
import {
  AdminBooking,
  useAdminBookings,
  useAcceptBooking,
  useRejectBooking,
  useCancelBooking,
} from "@/lib/queries";

export default function AdminBookingsPage() {
  // Show full skeleton only on first render before any data
  const [showFullSkeleton, setShowFullSkeleton] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Use hooks for data fetching with filters and pagination
  const { data: response, isLoading, error, refetch } = useAdminBookings({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: pageSize,
  });

  // Fetch overall stats separately (without filters - always shows total counts)
  const { data: overallResponse } = useAdminBookings({
    page: 1,
    limit: 1000, // Large limit to get all bookings for stats
  });

  const bookings = response?.bookings || [];
  const overallBookings = overallResponse?.bookings || [];
  const pagination = response?.pagination;

  // Hide full skeleton once we have data
  useEffect(() => {
    if (response) {
      setShowFullSkeleton(false);
    }
  }, [response]);

  // Mutations
  const acceptMutation = useAcceptBooking();
  const rejectMutation = useRejectBooking();
  const cancelMutation = useCancelBooking();

  // Image lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Timeline Modal state
  const [timelineBookingId, setTimelineBookingId] = useState<number | null>(
    null,
  );
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  // Note: Both status and search are now server-side filtered
  // No need for client-side filtering

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmed", color: "bg-blue-100 text-blue-700" };
      case "completed":
        return { label: "Completed", color: "bg-green-100 text-green-700" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-red-100 text-red-700" };
      case "rejected":
        return {
          label: "Rejected",
          color: "bg-orange-100 text-orange-700 font-bold",
        };
      case "reschedule_pending":
        return {
          label: "Reschedule Pending",
          color: "bg-orange-100 text-orange-700",
        };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error && bookings.length === 0) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : String(error)}
        onRetry={() => refetch()}
      />
    );
  }

  // Show full skeleton only on initial page load
  if (showFullSkeleton) {
    return <AdminBookingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Bookings Management"
        description="View and manage all bookings across the platform."
        onRefresh={() => refetch()}
      />

      {/* Stats Cards - Always show overall counts (never affected by filters) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                  Total
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {overallBookings.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                  Confirmed
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {overallBookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  Completed
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {overallBookings.filter((b) => b.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Cancelled
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {overallBookings.filter((b) => b.status === "cancelled").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, provider, service, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  {/* <SelectItem value="reschedule_pending">
                    Reschedule Pending
                  </SelectItem> */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{bookings.length}</span> of{" "}
        <span className="font-medium">{pagination?.total || 0}</span> bookings
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AdminBookingsTableSkeleton />
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg">
                              #{booking.id}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 shrink-0"
                            onClick={() => {
                              setTimelineBookingId(booking.id);
                              setIsTimelineOpen(true);
                            }}
                          >
                            <HistoryIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              View Timeline
                            </span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Customer
                            </p>
                            <p className="font-medium">
                              {booking.customerName || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.customerEmail}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Provider
                            </p>
                            <p className="font-medium">
                              {booking.businessName || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.serviceName}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              Amount
                            </p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(booking.price)}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Booked on {formatDate(booking.createdAt)}
                          {booking.bookingDate && (
                            <span>
                              {" "}
                              • Scheduled for {formatDate(booking.bookingDate)}
                            </span>
                          )}
                        </div>

                        {/* Completion Photos (if available) */}
                        {(booking.beforePhotoUrl || booking.afterPhotoUrl) && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-md p-4 border border-green-200 dark:border-green-800">
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
                                    <img
                                      src={booking.beforePhotoUrl}
                                      alt="Before service"
                                      className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
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
                                    <img
                                      src={booking.afterPhotoUrl}
                                      alt="After service"
                                      className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4">
          <DataTablePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={lightboxImage}
        alt="Service photo"
      />

      {/* Timeline Modal */}
      <BookingTimelineModal
        bookingId={timelineBookingId}
        open={isTimelineOpen}
        onOpenChange={setIsTimelineOpen}
      />
    </div>
  );
}
