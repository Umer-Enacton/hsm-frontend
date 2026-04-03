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
import type { PaymentOrderResponse } from "@/types/payment";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAfterBookingAction } from "@/lib/queries/query-invalidation";
import { useRazorpayScript } from "@/components/customer/payment/RazorpayCheckout";
import { useTheme } from "next-themes";

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
  rescheduleCount?: number; // Number of times already rescheduled
  onRescheduled?: () => void;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

const MAX_RESCHEDULES = 2;

export function RescheduleButton({
  bookingId,
  businessId,
  serviceId,
  servicePrice,
  serviceName,
  currentSlotId,
  currentBookingDate,
  rescheduleCount = 0,
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
  const queryClient = useQueryClient();
  const scriptLoaded = useRazorpayScript();
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [paymentOrderData, setPaymentOrderData] =
    useState<PaymentOrderResponse | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");

  // Flat ₹100 reschedule fee
  const RESCHEDULE_FEE = 100;

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

  // Check if slot is booked - check both status field and isAvailable boolean
  const isSlotBooked = (slot: Slot) => {
    // Check explicit status field
    const statusBooked = slot.status === "booked";
    // Check isAvailable boolean (false means booked)
    const availableFalse = slot.isAvailable === false;
    // Check if undefined/null - treat as available (better UX to show available)
    return statusBooked || availableFalse;
  };

  // Smart slot filtering - exclude past slots for today and current slot
  const getAvailableSlotsForDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];

    // If not today, show all slots
    if (dateStr !== today) {
      return slots;
    }

    // If today, filter out past slots and slots less than 1 hour away
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferMinutes = 60; // 1 hour buffer

    return slots.filter((slot) => {
      const slotTime = slot.startTime; // "HH:mm:ss"
      const [hours, minutes] = slotTime.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      // Only show slots at least 1 hour in future
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

      let slotsArray = response.slots || [];

      // IMPORTANT: Ensure all slots have isAvailable and status fields
      // If backend doesn't provide them, default to available
      slotsArray = slotsArray.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable ?? true,
        status: slot.status ?? "available",
      }));

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

      let slotsArray = response.slots || [];

      // IMPORTANT: Ensure all slots have isAvailable and status fields
      slotsArray = slotsArray.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable ?? true,
        status: slot.status ?? "available",
      }));

      // Debug: log slot availability
      console.log(
        `📊 [RescheduleButton] Slot availability for ${dateStr}:`,
        slotsArray.map((s) => ({
          id: s.id,
          time: s.startTime,
          available: s.isAvailable,
          status: s.status,
        })),
      );

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

      // Create payment order for reschedule fee (₹100)
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

      // Close modal before opening razorpay
      setShowModal(false);

      if (!scriptLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Payment gateway is loading. Please try again.");
        return;
      }

      const isDark = theme === "dark";

      const options = {
        key: response.keyId,
        amount: response.amount,
        currency: response.currency,
        name: "Home Service Management",
        description: `Payment for Reschedule: ${serviceName}`,
        order_id: response.razorpayOrderId,
        prefill: { name: "", email: "", contact: "" },
        notes: {
          payment_intent_id: response.paymentIntentId.toString(),
          service_name: `Reschedule: ${serviceName}`,
        },
        timeout: 60, // 1 minute expiration
        theme: { color: isDark ? "#334155" : "#000000" },
        modal: {
          ondismiss: async () => {
            console.log("ℹ️ Razorpay modal closed by user");
            try {
              await api.post(API_ENDPOINTS.PAYMENT.CANCEL_INTENT, {
                paymentIntentId: response.paymentIntentId,
              });
            } catch (err) {}
            handlePaymentCancel();
          },
          escape: true,
          backdropclose: false,
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.success", async function(rzpResp: any) {
        try {
          const razorpayPaymentId =
            rzpResp.payload?.payment?.id ||
            rzpResp.payload?.payment?.razorpay_payment_id ||
            rzpResp.razorpay_payment_id;
          
          const razorpayOrderId = response.razorpayOrderId;
          
          const razorpaySignature =
            rzpResp.payload?.payment?.razorpay_signature ||
            rzpResp.razorpay_signature ||
            rzpResp.signature ||
            "";

          // Verify Payment backend
          await api.post(API_ENDPOINTS.PAYMENT.VERIFY, {
            razorpayOrderId,
            razorpayPaymentId,
            signature: razorpaySignature,
            paymentIntentId: response.paymentIntentId,
          });

          invalidateAfterBookingAction(queryClient);

          toast.success("Reschedule payment successful!");
          handlePaymentSuccess();
        } catch (err: any) {
          toast.error(err.message || "Payment verification failed");
          handlePaymentCancel();
        }
      });

      rzp.on("payment.failed", async function (error: any) {
          let errorCode, errorDescription;
          if (error.payload && error.payload.error) {
            errorCode = error.payload.error.code;
            errorDescription = error.payload.error.description;
          } else if (error.error) {
            errorCode = error.error.code;
            errorDescription = error.error.description || error.error.metadata?.reason;
          } else {
            errorDescription = error.description || error.reason || "Payment failed";
          }
  
          try {
            await api.post(API_ENDPOINTS.PAYMENT.FAILED, {
              paymentIntentId: response.paymentIntentId,
              errorCode,
              errorDescription,
            });
          } catch (recordError) {}
  
          toast.error(errorDescription || "Payment failed. Please try again.");
          handlePaymentCancel();
      });

      rzp.open();
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
        <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950 border-2 border-green-500 dark:border-green-700" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded bg-black dark:bg-white" />
        <span>Selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 opacity-60" />
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
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                Select a date to see available times
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-md" />
              ))}
            </div>
          ) : (
            (() => {
              const displaySlots = getAvailableSlotsForDate(selectedDate);

              if (displaySlots.length === 0) {
                return (
                  <div className="text-center py-8 bg-muted/50 rounded-md">
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
                    // Normalize both dates to YYYY-MM-DD for comparison
                    const normalizedCurrentDate = currentBookingDate
                      ? new Date(currentBookingDate).toISOString().split("T")[0]
                      : "";
                    const isCurrent =
                      slot.id === currentSlotId &&
                      selectedDate === normalizedCurrentDate;
                    const isDisabled = booked || isCurrent;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => !isDisabled && setSelectedSlot(slot)}
                        disabled={isDisabled}
                        className={`px-3 py-2 rounded-md border text-sm font-medium transition-all relative ${
                          isSelected
                            ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                            : isCurrent
                              ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 opacity-60 cursor-not-allowed"
                              : booked
                                ? "border-border bg-muted opacity-50 cursor-not-allowed"
                                : "bg-green-100 dark:bg-green-950 border-2 border-green-500 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900"
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
                className={`px-3 py-2 rounded-md border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
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
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {selectedDate && selectedSlot && (
          <div className="bg-muted/50 rounded-md p-3">
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
          className="bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-200 text-white dark:text-black"
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
                  A <strong>₹100 reschedule fee</strong> will be charged to
                  change your booking.
                </p>
                <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Service price:</span>
                    <span>{servicePrice} ₹</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-600">
                    <span>Reschedule fee:</span>
                    <span>{RESCHEDULE_FEE} ₹</span>
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
                className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${RESCHEDULE_FEE} ₹ to Reschedule`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* No inline Payment Modal rendering needed here */}

        <button
          onClick={() => {
            if (rescheduleCount >= MAX_RESCHEDULES) {
              toast.error(
                `Maximum reschedule limit (${MAX_RESCHEDULES}) reached`,
              );
              return;
            }
            setShowModal(true);
          }}
          disabled={isRescheduling || rescheduleCount >= MAX_RESCHEDULES}
          className={className}
          title={
            rescheduleCount >= MAX_RESCHEDULES
              ? `Maximum ${MAX_RESCHEDULES} reschedules allowed`
              : `Reschedule (${rescheduleCount}/${MAX_RESCHEDULES} used)`
          }
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Reschedule
          {rescheduleCount > 0 && (
            <span className="ml-1 text-xs opacity-75">
              ({rescheduleCount}/{MAX_RESCHEDULES})
            </span>
          )}
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
                A <strong>₹100 reschedule fee</strong> will be charged to change
                your booking.
              </p>
              <div className="bg-muted rounded-md p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Service price:</span>
                  <span>{servicePrice} ₹</span>
                </div>
                <div className="flex justify-between font-semibold text-amber-600">
                  <span>Reschedule fee:</span>
                  <span>{RESCHEDULE_FEE} ₹</span>
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
              className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${RESCHEDULE_FEE} ₹ to Reschedule`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No inline Payment Modal rendering needed here */}

      <Button
        size={size}
        variant="outline"
        onClick={() => {
          if (rescheduleCount >= MAX_RESCHEDULES) {
            toast.error(
              `Maximum reschedule limit (${MAX_RESCHEDULES}) reached`,
            );
            return;
          }
          setShowModal(true);
        }}
        disabled={rescheduleCount >= MAX_RESCHEDULES}
        className={className}
        title={
          rescheduleCount >= MAX_RESCHEDULES
            ? `Maximum ${MAX_RESCHEDULES} reschedules allowed`
            : `Reschedule (${rescheduleCount}/${MAX_RESCHEDULES} used)`
        }
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Reschedule
        {rescheduleCount > 0 && (
          <span className="ml-1 text-xs opacity-75">
            ({rescheduleCount}/{MAX_RESCHEDULES})
          </span>
        )}
      </Button>
    </>
  );
}
