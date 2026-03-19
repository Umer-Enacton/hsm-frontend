"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface InvoicePreviewModalProps {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Business {
  id: number;
  businessName: string;
  description?: string;
  logo?: string | null;
  email?: string;
  phone?: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  EstimateDuration?: number;
}

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
}

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface BookingDetails {
  id: number;
  bookingDate: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  business: Business;
  customer: Customer;
  service: Service;
  slot: Slot;
  address: Address;
  // Reschedule fields
  rescheduleOutcome?: "pending" | "accepted" | "rejected" | "cancelled" | null;
  rescheduleCount?: number;
  lastRescheduleFee?: number;
  previousBookingDate?: string;
  previousSlotTime?: string;
}

export function InvoicePreviewModal({
  bookingId,
  open,
  onOpenChange,
}: InvoicePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<BookingDetails | null>(null);

  useEffect(() => {
    if (open && bookingId) {
      fetchBookingDetails();
    }
  }, [open, bookingId]);

  useEffect(() => {
    if (open && bookingId) {
      fetchBookingDetails();
    }
  }, [open, bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);

      // Fetch booking details (already enriched with service, address, slot)
      const response: any = await api.get(
        API_ENDPOINTS.BOOKING_BY_ID(bookingId),
      );
      const booking = response.booking;

      // Fetch business profile separately
      const businessRes: any = await api.get(
        API_ENDPOINTS.BUSINESS_BY_ID(booking.businessProfileId),
      );

      // Fetch user profile for customer info
      const userProfile: any = await api.get(API_ENDPOINTS.USER_PROFILE);

      setBookingData({
        id: booking.id,
        bookingDate: booking.bookingDate,
        createdAt: booking.createdAt || booking.bookingDate,
        totalPrice: booking.totalPrice,
        status: booking.status,
        business: businessRes.business,
        customer: {
          id: userProfile.user.id,
          name: userProfile.user.name || userProfile.user.email,
          email: userProfile.user.email,
          phone: userProfile.user.phone,
        },
        service: booking.service,
        slot: booking.slot,
        address: booking.address,
        // Include reschedule fields
        rescheduleOutcome: booking.rescheduleOutcome,
        rescheduleCount: booking.rescheduleCount,
        lastRescheduleFee: booking.lastRescheduleFee,
        previousBookingDate: booking.previousBookingDate,
        previousSlotTime: booking.previousSlotTime,
      });
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    if (!bookingData) return "";
    const date = new Date(bookingData.createdAt);
    const year = date.getFullYear();
    return `INV-${year}-${bookingData.id.toString().padStart(4, "0")}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";

    const date = new Date(dateStr);

    // Check if date is valid
    if (isNaN(date.getTime())) return "N/A";

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return "N/A";

    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "N/A";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!p-0 sm:!max-w-[50vw]">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-20 flex flex-row items-center justify-between w-full">
          <DialogTitle className="text-xl font-semibold">
            Invoice Preview
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookingData ? (
          <div className="overflow-y-auto max-h-[calc(95vh-80px)] bg-slate-100/50 p-4">
            {/* Invoice Container - ALWAYS LIGHT (It's a paper document!) */}
            <div className="w-full bg-white rounded-xl shadow-lg text-slate-900 p-10">
              {/* ============================================ */}
              {/* HEADER SECTION */}
              {/* ============================================ */}
              <div className="flex justify-between items-start mb-8">
                {/* Left - Logo and Business Name */}
                <div className="flex items-start gap-4">
                  <img
                    src="/homefixcareicon-removebg-preview-removebg-preview.png"
                    alt="Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-blue-600">
                      HomeFixCare
                    </h1>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {bookingData.business.businessName || "Home Service Pro"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {bookingData.business.description ||
                        "Quality Service Solutions"}
                    </p>
                  </div>
                </div>

                {/* Right - Invoice Info */}
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-900">
                    INVOICE
                  </h2>
                  <p className="text-lg font-semibold text-slate-600 mt-1">
                    #{generateInvoiceNumber()}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Issued: {formatDate(bookingData.createdAt)}
                  </p>

                  {/* PAID Badge */}
                  <div className="inline-flex items-center justify-center px-4 py-1.5 bg-green-100 border-2 border-green-700 rounded-full mt-3">
                    <span className="text-sm font-bold text-green-700">
                      PAID
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-0.5 bg-slate-200 mb-8"></div>

              {/* ============================================ */}
              {/* ADDRESSES SECTION */}
              {/* ============================================ */}
              <div className="bg-slate-50 rounded-xl p-6 mb-8">
                <div className="grid grid-cols-2 gap-8">
                  {/* Bill To */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                      Bill To
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {bookingData.customer.name}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      {bookingData.address.street}
                    </p>
                    <p className="text-sm text-slate-600">
                      {bookingData.address.city}, {bookingData.address.state}{" "}
                      {bookingData.address.zipCode}
                    </p>
                    {bookingData.customer.phone && (
                      <p className="text-sm text-slate-600 mt-1">
                        {bookingData.customer.phone}
                      </p>
                    )}
                  </div>

                  {/* Service Address */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                      Service Address
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {bookingData.address.street},
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      {bookingData.address.city}, {bookingData.address.state}{" "}
                      {bookingData.address.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* SERVICE TABLE */}
              {/* ============================================ */}
              <div className="mb-8">
                {/* Table Header */}
                <div className="bg-slate-100 rounded-t-lg px-6 py-3">
                  <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                    <div>Description</div>
                    <div>Date & Time</div>
                    <div>Duration</div>
                    <div className="text-right">Amount</div>
                  </div>
                </div>

                {/* Table Row */}
                <div className="bg-slate-50 rounded-b-lg px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 items-start">
                    {/* Description */}
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {bookingData.service.name}
                      </p>
                      {bookingData.service.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {bookingData.service.description.substring(0, 50)}
                          ...
                        </p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div className="text-sm text-slate-600">
                      {formatDate(bookingData.bookingDate)} at{" "}
                      {formatTime(bookingData.slot.startTime)}
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-slate-600">
                      {formatDuration(
                        bookingData.service.duration ||
                          bookingData.service.EstimateDuration,
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-sm font-bold text-slate-900 text-right">
                      {formatCurrency(
                        bookingData.service.price || bookingData.totalPrice,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* TOTALS & NOTES SECTION */}
              {/* ============================================ */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left - Notes & Terms */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
                    Notes & Terms
                  </p>
                  <div className="text-xs text-slate-600 space-y-3">
                    <p>
                      Payment received on {formatDate(bookingData.createdAt)}{" "}
                      via{" "}
                      {bookingData.status === "completed"
                        ? "service completion"
                        : "booking"}
                      .
                    </p>
                    <p>All service parts include a 90-day labor guarantee.</p>
                    <p>
                      For queries, contact support or call business directly.
                    </p>
                  </div>
                </div>

                {/* Right - Totals Box */}
                <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-6">
                  <div className="space-y-4">
                    {/* Service Charge */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Service Charge</span>
                      <span className="text-sm text-slate-900 font-semibold">
                        {formatCurrency(bookingData.service?.price || bookingData.totalPrice)}
                      </span>
                    </div>

                    {/* Reschedule Fee (if applicable) */}
                    {bookingData.rescheduleOutcome === "pending" || bookingData.rescheduleOutcome === "accepted" ? (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Reschedule Fee</span>
                        <span className="text-sm text-purple-700 font-semibold">
                          ₹{bookingData.lastRescheduleFee ? bookingData.lastRescheduleFee / 100 : 100}
                        </span>
                      </div>
                    ) : bookingData.rescheduleOutcome === "rejected" || bookingData.rescheduleOutcome === "cancelled" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Reschedule Fee</span>
                          <span className="text-sm text-slate-900 font-semibold">
                            ₹{bookingData.lastRescheduleFee ? bookingData.lastRescheduleFee / 100 : 100}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Refund</span>
                          <span className="text-sm text-green-700 font-semibold">
                            -₹{bookingData.lastRescheduleFee ? bookingData.lastRescheduleFee / 100 : 100}
                          </span>
                        </div>
                      </>
                    ) : null}

                    {/* Tax */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Tax (Included)
                      </span>
                      <span className="text-xs text-slate-400">
                        Included in subtotal
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-slate-200"></div>

                    {/* Total Amount */}
                    {(() => {
                      const servicePrice = bookingData.service?.price || bookingData.totalPrice;
                      const rescheduleFee = bookingData.lastRescheduleFee ? bookingData.lastRescheduleFee / 100 : 100;
                      const hasRefund = bookingData.rescheduleOutcome === "rejected" || bookingData.rescheduleOutcome === "cancelled";
                      const finalTotal = hasRefund ? servicePrice : (servicePrice + (bookingData.rescheduleOutcome ? rescheduleFee : 0));

                      return (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                            Total
                          </span>
                          <span className="text-2xl font-black text-blue-600">
                            {formatCurrency(finalTotal)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* RESCHEDULE DETAILS (if applicable) */}
              {/* ============================================ */}
              {bookingData.rescheduleOutcome && bookingData.previousBookingDate && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8">
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">
                    Reschedule Details
                  </p>
                  <div className="text-sm text-purple-900">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-700">From:</span>
                      <span className="font-medium">
                        {formatDate(bookingData.previousBookingDate)}
                        {bookingData.previousSlotTime && ` at ${formatTime(bookingData.previousSlotTime)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-purple-700">To:</span>
                      <span className="font-medium">
                        {formatDate(bookingData.bookingDate)} at {formatTime(bookingData.slot?.startTime)}
                      </span>
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      Status: {bookingData.rescheduleOutcome === "pending" ? "Pending approval" :
                        bookingData.rescheduleOutcome === "accepted" ? "Approved" :
                        bookingData.rescheduleOutcome === "rejected" ? "Declined by provider" :
                        "Cancelled"}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* FOOTER SECTION */}
              {/* ============================================ */}
              <div className="bg-slate-100 rounded-xl p-6">
                <p className="text-xs text-slate-500 text-center mb-3">
                  For questions, contact support@homeservice.com or call +91
                  9876543210
                </p>

                {/* Branding */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-0.5 bg-slate-400"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Home Service Management
                  </p>
                  <div className="w-5 h-0.5 bg-slate-400"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-slate-500">
            Failed to load invoice details
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
