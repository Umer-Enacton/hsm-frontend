"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, X, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
}

interface RescheduleButtonProps {
  bookingId: number;
  businessId: number;
  serviceId: number;
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
  currentSlotId,
  currentBookingDate,
  onRescheduled,
  variant = "button",
  size = "sm",
  className = "",
}: RescheduleButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Get next 7 days for rescheduling
  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        value: dateStr,
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }
    return days;
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
      const slotsData: any = await api.get(
        API_ENDPOINTS.SLOTS_PUBLIC(businessId)
      );
      const slotsArray = Array.isArray(slotsData)
        ? slotsData
        : slotsData?.slots || [];
      setSlots(slotsArray);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load available slots");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    try {
      setIsRescheduling(true);
      // TODO: Backend API needs to be created for rescheduling
      // For now, we'll show a message
      toast.info(
        `Reschedule to ${selectedDate} at ${formatTime(selectedSlot.startTime)} - Coming soon!`
      );

      // Future implementation:
      // await api.patch(API_ENDPOINTS.BOOKING_BY_ID(bookingId), {
      //   slotId: selectedSlot.id,
      //   bookingDate: selectedDate,
      // });

      // toast.success("Booking rescheduled successfully");
      // setShowModal(false);
      // onRescheduled?.();
    } catch (error: any) {
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

  const availableDates = getNext7Days();

  if (variant === "dropdown") {
    return (
      <>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reschedule Booking</DialogTitle>
              <DialogDescription>
                Choose a new date and time for your appointment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Select Date
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.value);
                        setSelectedSlot(null);
                      }}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        selectedDate === day.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {day.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Select Time
                </label>
                {!selectedDate ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select a date to see available times
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <X className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No time slots available
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots
                      .filter((slot) => slot.id !== currentSlotId) // Exclude current slot
                      .map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedSlot?.id === slot.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          } ${slot.id === currentSlotId ? "opacity-50" : ""}`}
                          disabled={slot.id === currentSlotId}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected Summary */}
              {selectedDate && selectedSlot && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">
                    New Schedule:
                  </p>
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
                }}
                disabled={isRescheduling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!selectedDate || !selectedSlot || isRescheduling}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rescheduling...
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
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your appointment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Select Date
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.value);
                      setSelectedSlot(null);
                    }}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      selectedDate === day.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs font-medium">
                      {day.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Select Time
              </label>
              {!selectedDate ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a date to see available times
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <X className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No time slots available
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots
                    .filter((slot) => slot.id !== currentSlotId) // Exclude current slot
                    .map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedSlot?.id === slot.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        } ${slot.id === currentSlotId ? "opacity-50" : ""}`}
                        disabled={slot.id === currentSlotId}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Selected Summary */}
            {selectedDate && selectedSlot && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">
                  New Schedule:
                </p>
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
              }}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedSlot || isRescheduling}
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
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
