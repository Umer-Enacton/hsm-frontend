"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { AdminPageHeader, LoadingState, ErrorState, StatusBadge } from "@/components/admin/shared";
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

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "reschedule_pending";

interface Booking {
  id: number;
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
  bookingDate?: string;
  slot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  service?: {
    id: number;
    name: string;
    price: number;
  };
  businessProfile?: {
    id: number;
    name: string;
    user?: {
      name: string;
      email: string;
      phone: string;
    };
  };
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  address?: {
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all bookings using admin endpoint
      const response: any = await api.get(API_ENDPOINTS.ADMIN_BOOKINGS_ALL);
      setBookings(response.bookings || response || []);
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.businessProfile?.name?.toLowerCase().includes(term) ||
          b.user?.name?.toLowerCase().includes(term) ||
          b.user?.email?.toLowerCase().includes(term) ||
          b.service?.name?.toLowerCase().includes(term) ||
          b.id.toString().includes(term)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter]);

  const getStatusInfo = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "bg-yellow-100 text-yellow-700" };
      case "confirmed":
        return { label: "Confirmed", color: "bg-blue-100 text-blue-700" };
      case "completed":
        return { label: "Completed", color: "bg-green-100 text-green-700" };
      case "cancelled":
        return { label: "Cancelled", color: "bg-red-100 text-red-700" };
      case "reschedule_pending":
        return { label: "Reschedule Pending", color: "bg-orange-100 text-orange-700" };
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

  if (isLoading) {
    return <LoadingState message="Loading bookings..." />;
  }

  if (error && bookings.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchBookings()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Bookings Management"
        description="View and manage all bookings across the platform."
        onRefresh={() => fetchBookings()}
      />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter((b) => b.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter((b) => b.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {bookings.filter((b) => b.status === "cancelled").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 opacity-50" />
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="reschedule_pending">Reschedule Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                return (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg">#{booking.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Customer
                            </p>
                            <p className="font-medium">{booking.user?.name || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Provider
                            </p>
                            <p className="font-medium">{booking.businessProfile?.name || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{booking.service?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              Amount
                            </p>
                            <p className="font-medium text-green-600">{formatCurrency(booking.totalPrice)}</p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Booked on {formatDate(booking.createdAt)}
                          {booking.slot?.date && (
                            <span> • Scheduled for {formatDate(booking.slot.date)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
