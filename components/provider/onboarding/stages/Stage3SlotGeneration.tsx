"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Clock, Coffee, Sparkles, Info } from "lucide-react";
import { WorkingHours, BreakTime } from "@/types/provider";
import { cn } from "@/lib/utils";

interface Stage3SlotGenerationProps {
  workingHours: WorkingHours;
  breakTime?: BreakTime;
  initialSlotInterval?: number;
  onNext: (slotInterval: number) => void;
}

export function Stage3SlotGeneration({
  workingHours,
  breakTime,
  initialSlotInterval = 30,
  onNext,
}: Stage3SlotGenerationProps) {
  const [slotInterval, setSlotInterval] = useState(initialSlotInterval);

  // Track last notified interval to prevent duplicate calls
  const lastNotifiedIntervalRef = useRef<number>(0);

  useEffect(() => {
    // Only notify if interval has actually changed
    if (slotInterval !== lastNotifiedIntervalRef.current) {
      lastNotifiedIntervalRef.current = slotInterval;
      onNext(slotInterval);
    }
  }, [slotInterval, onNext]);

  // Helper: Convert "HH:mm" to minutes
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate total working hours and slots
  const calculateSlots = () => {
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);
    const totalMinutes = endMins - startMins;

    let breakMinutes = 0;
    if (breakTime) {
      breakMinutes = timeToMinutes(breakTime.endTime) - timeToMinutes(breakTime.startTime);
    }

    const effectiveMinutes = Math.max(0, totalMinutes - breakMinutes);
    const effectiveHours = Math.floor(effectiveMinutes / 60);
    const effectiveMins = effectiveMinutes % 60;
    const totalSlots = Math.floor(effectiveMinutes / slotInterval);

    return {
      totalWorkingTime: `${effectiveHours}h ${effectiveMins}m`,
      totalSlots,
    };
  };

  const slotInfo = calculateSlots();

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
              Slot Generation Settings
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Select the time interval for booking slots. Based on your working hours
              {breakTime ? " (excluding break time)" : ""}, we'll automatically generate
              availability slots for customers to book.
            </p>
          </div>
        </div>
      </Card>

      {/* Working Hours Summary */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">Your Working Hours</h4>
            <p className="text-xs text-muted-foreground mt-1">
              These hours apply to all days
            </p>
            <div className="mt-2 text-base font-semibold">
              {workingHours.startTime} - {workingHours.endTime}
            </div>
          </div>
        </div>
      </Card>

      {/* Break Time Summary */}
      {breakTime && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="flex items-start gap-3">
            <Coffee className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">Break Time Configured</h4>
              <p className="text-xs text-muted-foreground mt-1">
                No slots will be generated during this time
              </p>
              <div className="mt-2 text-base font-semibold">
                {breakTime.startTime} - {breakTime.endTime}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Slot Interval Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Slot Interval</Label>
        <p className="text-sm text-muted-foreground">
          How often should customers be able to start bookings?
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {[15, 30, 60].map((interval) => (
            <Card
              key={interval}
              className={cn(
                "cursor-pointer border-2 transition-all hover:border-primary/50 p-4",
                slotInterval === interval
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              )}
              onClick={() => setSlotInterval(interval)}
            >
              <div className="text-center">
                <div className="text-2xl font-bold">{interval} min</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {interval === 15 && "Most flexible"}
                  {interval === 30 && "Balanced"}
                  {interval === 60 && "Simplest"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Slot Generation Summary */}
      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">Slot Generation Summary</h4>
            <p className="text-sm mt-2">
              Based on your configuration, we will generate:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Effective working time:</span>
                <span className="font-semibold">{slotInfo.totalWorkingTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total slots per day:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {slotInfo.totalSlots}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available every {slotInterval} minutes</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              These start times will repeat daily. Customers can book any service at these times.
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium">What happens next?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• We'll generate start times based on your settings</li>
          <li>• Start times repeat daily - no need to regenerate</li>
          <li>• Customers select a service + date + start time to book</li>
          <li>• You can add/remove start times anytime from Availability page</li>
        </ul>
      </div>
    </div>
  );
}
