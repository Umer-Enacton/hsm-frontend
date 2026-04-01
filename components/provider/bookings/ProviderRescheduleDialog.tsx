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
import { Textarea } from "@/components/ui/textarea";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAfterBookingAction } from "@/lib/queries/query-invalidation";
import type { Slot } from "@/types/customer";

// Preset reschedule reasons for provider
const PROVIDER_RESCHEDULE_REASONS = [
  { id: "schedule_conflict", label: "Schedule conflict" },
  { id: "emergency", label: "Emergency" },
  { id: "maintenance", label: "Maintenance issue" },
  { id: "double_booked", label: "Double booked" },
  { id: "personal", label: "Personal reason" },
  { id: "other", label: "Other" },
] as const;

interface ProviderRescheduleDialogProps {
  bookingId: number;
  businessId: number;
  serviceId: number;
  currentSlotId: number;
  currentBookingDate: string;
  onRescheduled?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProviderRescheduleDialog({
  bookingId,
  businessId,
  serviceId,
  currentSlotId,
  currentBookingDate,
  onRescheduled,
  open,
  onOpenChange,
}: ProviderRescheduleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const queryClient = useQueryClient();

  // Debug: Log props when they change
  useEffect(() => {
    console.log("🔍 [ProviderRescheduleDialog] Props changed:", {
      bookingId,
      businessId,
      serviceId,
      currentSlotId,
      currentBookingDate,
      open,
    });
  }, [
    bookingId,
    businessId,
    serviceId,
    currentSlotId,
    currentBookingDate,
    open,
  ]);

  // Auto-select first date when dialog opens
  useEffect(() => {
    console.log("📅 [ProviderRescheduleDialog] Dialog open check:", {
      open,
      selectedDate,
    });
    if (open && !selectedDate) {
      const days = getNext3Days();
      console.log("📅 [ProviderRescheduleDialog] Available days:", days);
      if (days.length > 0) {
        console.log(
          "📅 [ProviderRescheduleDialog] Auto-selecting first date:",
          days[0].value,
        );
        setSelectedDate(days[0].value);
        setSelectedSlot(null);
      }
    }
  }, [open]);

  // Get next 3 days (Today, Tomorrow, Overmorrow) - same as customer
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

  // Smart slot filtering - exclude past slots for today (same as customer)
  const getAvailableSlotsForDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];

    // If not today, show all slots
    if (dateStr !== today) {
      return slots;
    }

    // If today, filter out past slots and slots less than 30 min away
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferMinutes = 30; // 30 minute buffer for provider arrival

    return slots.filter((slot) => {
      const slotTime = slot.startTime; // "HH:mm:ss"
      const [hours, minutes] = slotTime.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      // Only show slots at least 30 minutes in future
      return slotMinutes > currentMinutes + bufferMinutes;
    });
  };

  // Load slots when date changes
  useEffect(() => {
    console.log(
      "🔄 [ProviderRescheduleDialog] Slot loading effect triggered:",
      {
        open,
        selectedDate,
        businessId,
        serviceId,
      },
    );

    if (open && selectedDate && businessId && serviceId) {
      console.log(
        "✅ [ProviderRescheduleDialog] All conditions met, loading slots...",
      );
      loadSlotsForDate(selectedDate);
    } else {
      console.log(
        "⚠️ [ProviderRescheduleDialog] Skipping slot load - missing:",
        {
          hasOpen: !!open,
          hasSelectedDate: !!selectedDate,
          hasBusinessId: !!businessId,
          hasServiceId: !!serviceId,
        },
      );
    }
  }, [selectedDate, open, businessId, serviceId]);

  const loadSlotsForDate = async (dateStr: string) => {
    try {
      setIsLoading(true);
      console.log(`🔄 [ProviderRescheduleDialog] Loading slots:`, {
        businessId,
        serviceId,
        date: dateStr,
        apiUrl: `${API_ENDPOINTS.SLOTS_PUBLIC(businessId)}`,
      });

      const queryParams = new URLSearchParams();
      queryParams.append("date", dateStr);
      queryParams.append("serviceId", serviceId.toString());

      const fullUrl = `${API_ENDPOINTS.SLOTS_PUBLIC(businessId)}?${queryParams.toString()}`;
      console.log(`🌐 [ProviderRescheduleDialog] Fetching URL: ${fullUrl}`);

      const response = await api.get<{ slots: Slot[] }>(fullUrl);

      console.log(`📦 [ProviderRescheduleDialog] Raw response:`, response);

      // Extract slots array from response (handle both formats)
      let slotsArray: Slot[] = [];
      if (response && response.slots && Array.isArray(response.slots)) {
        slotsArray = response.slots;
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        slotsArray = response;
      }

      // Debug: log slot availability
      console.log(
        `📊 [ProviderRescheduleDialog] Slot availability:`,
        slotsArray.map((s) => ({
          id: s.id,
          time: s.startTime,
          available: s.isAvailable,
          status: s.status,
        })),
      );

      // IMPORTANT: Ensure all slots have isAvailable and status fields
      // If backend doesn't provide them, default to available
      slotsArray = slotsArray.map((slot) => ({
        ...slot,
        isAvailable: slot.isAvailable ?? true,
        status: slot.status ?? "available",
      }));
      setSlots(slotsArray);
    } catch (error: any) {
      console.error(
        "❌ [ProviderRescheduleDialog] Error loading slots:",
        error,
      );
      toast.error(`Failed to load slots: ${error?.message || "Unknown error"}`);
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a new date and time");
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

    // Build reason string
    const reasonLabels: string[] = selectedReasons
      .map(
        (id) =>
          PROVIDER_RESCHEDULE_REASONS.find((r) => r.id === id)?.label || "",
      )
      .filter(Boolean);

    if (selectedReasons.includes("other") && otherReason) {
      reasonLabels.push(otherReason);
    }

    const reasonString = reasonLabels.join(", ");

    try {
      setIsRescheduling(true);

      await api.put(API_ENDPOINTS.PROVIDER_RESCHEDULE(bookingId), {
        slotId: selectedSlot.id,
        bookingDate: new Date(selectedDate).toISOString(),
        reason: reasonString,
      });

      toast.success(
        "Booking rescheduled successfully. Customer will be notified.",
      );
      // Invalidate ALL booking and notification queries
      invalidateAfterBookingAction(queryClient);
      onOpenChange(false);
      onRescheduled?.();

      // Reset form
      setSelectedDate("");
      setSelectedSlot(null);
      setSelectedReasons([]);
      setOtherReason("");
    } catch (error: any) {
      console.error("Error rescheduling:", error);
      toast.error(error.message || "Failed to reschedule booking");
    } finally {
      setIsRescheduling(false);
    }
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
  const today = new Date().toISOString().split("T")[0];

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

  return (
    <>
      {console.log("🎨 [ProviderRescheduleDialog] Rendering dialog:", {
        open,
        selectedDate,
        slotsCount: slots.length,
        isLoading,
      })}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Select a new date and time for this booking. This will be
              automatically confirmed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Select New Date
              </label>
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
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                        : "border-border hover:border-gray-400 dark:hover:border-gray-600 hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-sm font-medium">{day.displayDate}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Select New Time
              </label>
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">
                  {selectedDate
                    ? formatDate(selectedDate)
                    : "Select a date first"}
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
                  const displaySlots = selectedDate
                    ? getAvailableSlotsForDate(selectedDate)
                    : [];

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
                          ? new Date(currentBookingDate)
                              .toISOString()
                              .split("T")[0]
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
                            title={
                              isCurrent
                                ? "Your current booked slot"
                                : booked
                                  ? "This slot is already booked"
                                  : "Available for rescheduling"
                            }
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
              <div className="grid grid-cols-3 gap-2">
                {PROVIDER_RESCHEDULE_REASONS.map((reason) => (
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
                    className={`px-2 py-2 rounded border text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                      selectedReasons.includes(reason.id)
                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : "border-border hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedReasons.includes(reason.id)}
                      className="pointer-events-none"
                    />
                    <span className="truncate">{reason.label}</span>
                  </button>
                ))}
              </div>

              {/* Other reason text input */}
              {selectedReasons.includes("other") && (
                <div className="mt-3">
                  <Textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Please provide more details..."
                    className="min-h-[60px] text-sm"
                  />
                </div>
              )}
            </div>

            {/* Selected Summary */}
            {selectedDate && selectedSlot && (
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-3 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium mb-1 text-purple-900 dark:text-purple-100">
                  New Schedule:
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{formatTime(selectedSlot.startTime)}</span>
                </div>
              </div>
            )}

            {/* Info message */}
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  <p className="font-medium mb-1">Provider Reschedule</p>
                  <p>
                    This will be automatically confirmed. The customer will be
                    notified of the new time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
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
              onClick={handleReschedule}
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
                  Confirm Reschedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
