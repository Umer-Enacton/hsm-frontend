"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  X,
  Loader2,
  CalendarDays,
  Calendar as CalendarIcon,
  AlertTriangle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { PaymentModal } from "@/components/customer/payment";
import type { PaymentOrderResponse } from "@/types/payment";

interface Slot {
  id: number;
  startTime: string;
  endTime?: string;
  status?: "available" | "booked";
  isAvailable?: boolean;
}

// Preset reschedule reasons
const RESCHEDULE_REASONS = [
  { id: "work_conflict", label: "Work conflict" },
  { id: "emergency", label: "Emergency" },
  { id: "travel", label: "Travel plans" },
  { id: "health", label: "Health issue" },
  { id: "double_booking", label: "Double booking" },
  { id: "time_changed", label: "Time preference changed" },
  { id: "other", label: "Other" },
] as const;

interface RescheduleButtonProps {
  bookingId: number;
  businessId: number;
  serviceId: number;
  servicePrice: number; // Price in rupees
  serviceName: string; // Service name for payment description
  currentSlotId: number;
  currentBookingDate: string;
  onRescheduled?: () => void;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function RescheduleButton({
  bookingId,
  businessId,
  serviceId,
  servicePrice,
  serviceName,
  currentSlotId,
  currentBookingDate,
  onRescheduled,
  variant = "button",
  size = "sm",
  className = "",
}: RescheduleButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showFeeWarning, setShowFeeWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [paymentOrderData, setPaymentOrderData] =
    useState<PaymentOrderResponse | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");

  // Calculate 10% reschedule fee
  const rescheduleFee = Math.ceil(servicePrice * 0.1);

  // Get next 3 days (Today, Tomorrow, Overmorrow)
  const getNext3Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];

      days.push({
        value: dateStr,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Overmorrow",
        displayDate: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }

    return days;
  };

  // Check if slot is booked
  const isSlotBooked = (slot: Slot) => {
    return slot.status === "booked" || slot.isAvailable === false;
  };

  // Smart slot filtering - exclude past slots for today and current slot
  const getAvailableSlotsForDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];

    // If not today, show all slots
    if (dateStr !== today) {
      return slots;
    }

    // If today, filter out past slots and slots less than 30 min away
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferMinutes = 30; // 30 minute buffer

    return slots.filter((slot) => {
      const slotTime = slot.startTime; // "HH:mm:ss"
      const [hours, minutes] = slotTime.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      // Only show slots at least 30 minutes in future
      return slotMinutes > currentMinutes + bufferMinutes;
    });
  };

  // Load slots when modal opens
  useEffect(() => {
    if (showModal && businessId) {
      loadSlots();
    }
  }, [showModal, businessId]);

  const loadSlots = async () => {
    try {
      setIsLoading(true);
      // Pass date and serviceId to get availability status
      const queryParams = new URLSearchParams();
      const today = new Date().toISOString().split("T")[0];
      queryParams.append("date", today);
      queryParams.append("serviceId", serviceId.toString());

      const response = await api.get<{ slots: Slot[] }>(
        `${API_ENDPOINTS.SLOTS_PUBLIC(businessId)}?${queryParams.toString()}`,
      );

      const slotsArray = response.slots || [];
      setSlots(slotsArray);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setIsLoading(false);
    }
  };

  // Reload slots when date changes
  useEffect(() => {
    if (selectedDate && showModal) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadSlotsForDate = async (dateStr: string) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append("date", dateStr);
      queryParams.append("serviceId", serviceId.toString());

      const response = await api.get<{ slots: Slot[] }>(
        `${API_ENDPOINTS.SLOTS_PUBLIC(businessId)}?${queryParams.toString()}`,
      );

      const slotsArray = response.slots || [];
      setSlots(slotsArray);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    // Validate at least one reason is selected
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason for rescheduling");
      return;
    }

    // If "other" is selected, require additional text
    if (selectedReasons.includes("other") && !otherReason.trim()) {
      toast.error("Please specify the reason for rescheduling");
      return;
    }

    // Show fee warning first
    setShowFeeWarning(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot");
      setShowFeeWarning(false);
      return;
    }

    // Build reason string
    const reasonLabels: string[] = selectedReasons
      .map((id) => RESCHEDULE_REASONS.find((r) => r.id === id)?.label || "")
      .filter(Boolean);

    if (selectedReasons.includes("other") && otherReason) {
      reasonLabels.push(otherReason);
    }

    const reasonString = reasonLabels.join(", ");

    try {
      setIsRescheduling(true);
      setShowFeeWarning(false);

      // Create payment order for reschedule fee (10%)
      const bookingData = {
        serviceId,
        slotId: selectedSlot.id,
        bookingDate: new Date(selectedDate).toISOString(),
        reschedule: true,
        bookingId,
        reason: reasonString, // Send reason to backend
      };

      console.log("🔍 Creating reschedule payment order:", bookingData);

      const response = await api.post<PaymentOrderResponse>(
        API_ENDPOINTS.PAYMENT.CREATE_ORDER,
        bookingData,
      );

      console.log(
        "✅ Reschedule payment order created:",
        response.paymentIntentId,
      );

      // Set payment order data and show payment modal
      setPaymentOrderData(response);
      setShowModal(false);
    } catch (error: any) {
      console.error("Reschedule payment order error:", error);

      const errorCode = error.code || error.cause?.code;
      const errorMessage = error.message || error.cause?.message;

      if (errorCode === "SLOT_LOCKED" || error.statusCode === 409) {
        toast.error(
          "Another customer is currently booking this slot. Please wait a moment or choose a different slot.",
        );
      } else if (errorCode === "SLOT_ALREADY_BOOKED") {
        toast.error(
          "This slot has already been booked. Please select a different time.",
        );
      } else {
        toast.error(errorMessage || "Failed to initiate reschedule payment");
      }
    } finally {
      setIsRescheduling(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log("✅ Reschedule payment successful");
    setPaymentOrderData(null);
    setSelectedDate("");
    setSelectedSlot(null);
    onRescheduled?.();
  };

  const handlePaymentCancel = () => {
    console.log("❌ Reschedule payment cancelled");
    setPaymentOrderData(null);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const availableDates = getNext3Days();

  const SlotLegend = () => (
    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground py-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-black" />
        <span>Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded border border-amber-300 bg-amber-50 opacity-60" />
        <span>Current</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded border border-border bg-muted opacity-50" />
        <span>Booked</span>
      </div>
    </div>
  );

  const renderDialogContent = () => (
    <>
      <DialogHeader>
        <DialogTitle>Reschedule Booking</DialogTitle>
        <DialogDescription>
          Choose a new date and time for your appointment
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Date Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Select Date</label>
          <div className="grid grid-cols-3 gap-3">
            {availableDates.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => {
                  setSelectedDate(day.value);
                  setSelectedSlot(null);
                }}
                className={`p-1 rounded-sm border-2 text-center transition-all ${
                  selectedDate === day.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="text-sm font-medium">{day.displayDate}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">Select Time</label>
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              {selectedDate ? formatDate(selectedDate) : "Select a date first"}
            </p>
          </div>

          {/* Slot Legend */}
          {selectedDate && <SlotLegend />}

          {!selectedDate ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                Select a date to see available times
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : (
            (() => {
              const displaySlots = getAvailableSlotsForDate(selectedDate);

              if (displaySlots.length === 0) {
                return (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <X className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No time slots available for this date
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {displaySlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    const isSelected = selectedSlot?.id === slot.id;
                    const isCurrent = slot.id === currentSlotId;
                    const isDisabled = booked || isCurrent;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => !isDisabled && setSelectedSlot(slot)}
                        disabled={isDisabled}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all relative ${
                          isSelected
                            ? "bg-black text-white shadow-lg"
                            : isCurrent
                              ? "border-amber-300 bg-amber-50 opacity-60 cursor-not-allowed"
                              : booked
                                ? "border-border bg-muted opacity-50 cursor-not-allowed"
                                : "bg-green-100 border-2 border-green-500"
                        }`}
                      >
                        {formatTime(slot.startTime)}
                        {isCurrent && (
                          <span
                            className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-background"
                            title="Your current slot"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>

        {/* Reason Selection - Required */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Reason for Reschedule <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESCHEDULE_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => {
                  if (selectedReasons.includes(reason.id)) {
                    setSelectedReasons((prev) =>
                      prev.filter((r) => r !== reason.id),
                    );
                    if (reason.id === "other") setOtherReason("");
                  } else {
                    setSelectedReasons((prev) => [...prev, reason.id]);
                  }
                }}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedReasons.includes(reason.id)
                    ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    : "border-border hover:border-purple-300 hover:bg-purple-50/50"
                }`}
              >
                <Checkbox
                  checked={selectedReasons.includes(reason.id)}
                  className="pointer-events-none"
                />
                {reason.label}
              </button>
            ))}
          </div>

          {/* Other reason text input */}
          {selectedReasons.includes("other") && (
            <div className="mt-3">
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Please specify the reason..."
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {selectedDate && selectedSlot && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">New Schedule:</p>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground ml-2" />
              <span>{formatTime(selectedSlot.startTime)}</span>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setShowModal(false);
            setSelectedDate("");
            setSelectedSlot(null);
            setSelectedReasons([]);
            setOtherReason("");
          }}
          disabled={isRescheduling}
        >
          Cancel
        </Button>
        <Button
          onClick={handleProceedToPayment}
          disabled={
            !selectedDate ||
            !selectedSlot ||
            selectedReasons.length === 0 ||
            isRescheduling
          }
          className="bg-black hover:gray-900 text-white"
        >
          {isRescheduling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CalendarDays className="h-4 w-4 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  if (variant === "dropdown") {
    return (
      <>
        {/* Reschedule Modal */}
        <Dialog
          open={showModal && !paymentOrderData}
          onOpenChange={setShowModal}
        >
          <DialogContent className="sm:max-w-lg">
            {renderDialogContent()}
          </DialogContent>
        </Dialog>

        {/* Reschedule Fee Warning Dialog */}
        <AlertDialog open={showFeeWarning} onOpenChange={setShowFeeWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Reschedule Fee Applies
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  A <strong>10% reschedule fee</strong> ({rescheduleFee} ₹) will
                  be charged to change your booking.
                </p>
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Service price:</span>
                    <span>{servicePrice} ₹</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-600">
                    <span>Reschedule fee (10%):</span>
                    <span>{rescheduleFee} ₹</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The new slot will be locked for 1 minute during payment. If
                  payment fails, your current booking will remain unchanged.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRescheduling}>
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmReschedule}
                disabled={isRescheduling}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${rescheduleFee} ₹ to Reschedule`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Modal */}
        {paymentOrderData && selectedDate && selectedSlot && (
          <PaymentModal
            key={paymentOrderData.paymentIntentId}
            orderData={paymentOrderData}
            serviceName={`Reschedule: ${serviceName}`}
            servicePrice={rescheduleFee}
            bookingDate={selectedDate}
            slotTime={formatTime(selectedSlot.startTime)}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        )}

        <button
          onClick={() => setShowModal(true)}
          disabled={isRescheduling}
          className={className}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Reschedule
        </button>
      </>
    );
  }

  return (
    <>
      {/* Reschedule Modal */}
      <Dialog open={showModal && !paymentOrderData} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      {/* Reschedule Fee Warning Dialog */}
      <AlertDialog open={showFeeWarning} onOpenChange={setShowFeeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reschedule Fee Applies
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                A <strong>10% reschedule fee</strong> ({rescheduleFee} ₹) will
                be charged to change your booking.
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Service price:</span>
                  <span>{servicePrice} ₹</span>
                </div>
                <div className="flex justify-between font-semibold text-amber-600">
                  <span>Reschedule fee (10%):</span>
                  <span>{rescheduleFee} ₹</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The new slot will be locked for 1 minute during payment. If
                payment fails, your current booking will remain unchanged.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRescheduling}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReschedule}
              disabled={isRescheduling}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${rescheduleFee} ₹ to Reschedule`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {paymentOrderData && selectedDate && selectedSlot && (
        <PaymentModal
          key={paymentOrderData.paymentIntentId}
          orderData={paymentOrderData}
          serviceName={`Reschedule: ${serviceName}`}
          servicePrice={rescheduleFee}
          bookingDate={selectedDate}
          slotTime={formatTime(selectedSlot.startTime)}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}

      <Button
        size={size}
        variant="outline"
        onClick={() => setShowModal(true)}
        className={className}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Reschedule
      </Button>
    </>
  );
}
