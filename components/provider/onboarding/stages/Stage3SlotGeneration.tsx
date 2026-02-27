"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Clock, Coffee, Calendar, Sparkles } from "lucide-react";
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
  const lastNotifiedIntervalRef = useRef<number>(0);

  useEffect(() => {
    if (slotInterval !== lastNotifiedIntervalRef.current) {
      lastNotifiedIntervalRef.current = slotInterval;
      onNext(slotInterval);
    }
  }, [slotInterval, onNext]);

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime12Hour = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateSlots = () => {
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);
    const totalMinutes = endMins - startMins;

    let breakMinutes = 0;
    if (breakTime) {
      breakMinutes = timeToMinutes(breakTime.endTime) - timeToMinutes(breakTime.startTime);
    }

    const effectiveMinutes = totalMinutes - breakMinutes;
    const totalSlots = Math.floor(effectiveMinutes / slotInterval);

    const effectiveHours = Math.floor(effectiveMinutes / 60);
    const effectiveMins = effectiveMinutes % 60;

    return {
      totalWorkingTime: `${effectiveHours}h ${effectiveMins}m`,
      totalSlots,
    };
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);

    let current = startMins;
    while (current < endMins) {
      const hours = Math.floor(current / 60);
      const minutes = current % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if this time falls within break
      let isBreak = false;
      if (breakTime) {
        const breakStart = timeToMinutes(breakTime.startTime);
        const breakEnd = timeToMinutes(breakTime.endTime);
        if (current >= breakStart && current < breakEnd) {
          isBreak = true;
        }
      }

      if (!isBreak) {
        slots.push(timeStr);
      }

      current += slotInterval;
    }

    return slots;
  };

  const slotInfo = calculateSlots();
  const exampleSlots = generateTimeSlots().slice(0, 8); // Show first 8 slots as preview

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Slot Generation</h3>
        <p className="text-sm text-muted-foreground">
          Configure the time interval for booking slots
        </p>
      </div>

      {/* Working Hours Summary */}
      <Card className="p-5 bg-muted/50">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Your Working Hours</h4>
            <p className="text-2xl font-bold mt-1">
              {formatTime12Hour(workingHours.startTime)} - {formatTime12Hour(workingHours.endTime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              These hours apply to all days
            </p>
          </div>
        </div>
      </Card>

      {/* Break Time Summary */}
      {breakTime && (
        <Card className="p-5 bg-muted/30">
          <div className="flex items-start gap-3">
            <Coffee className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Break Time</h4>
              <p className="text-2xl font-bold mt-1">
                {formatTime12Hour(breakTime.startTime)} - {formatTime12Hour(breakTime.endTime)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No slots will be generated during this time
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Slot Interval Selection */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Select Slot Interval</Label>
        <p className="text-sm text-muted-foreground">
          How often should customers be able to start bookings?
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {[15, 30, 60].map((interval) => (
            <Card
              key={interval}
              className={cn(
                "cursor-pointer border-2 transition-all p-5",
                slotInterval === interval
                  ? "border-foreground bg-foreground/5"
                  : "border-muted hover:border-muted-foreground/50"
              )}
              onClick={() => setSlotInterval(interval)}
            >
              <div className="text-center">
                <div className="text-3xl font-bold">{interval}</div>
                <div className="text-xs text-muted-foreground mt-1">minutes</div>
                <div className="mt-3 text-xs font-medium text-muted-foreground">
                  {interval === 15 && "Most flexible"}
                  {interval === 30 && "Balanced"}
                  {interval === 60 && "Simplest"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Calendar Preview */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5" />
            <Label className="text-base font-semibold">Example Slots Preview</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            First {Math.min(8, generateTimeSlots().length)} slots for a typical day
          </p>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {exampleSlots.map((slot, index) => {
            const hours = parseInt(slot.split(':')[0]);
            const isMorning = hours < 12;

            return (
              <div
                key={slot}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  "bg-muted/30 hover:bg-muted/50 border-muted"
                )}
              >
                <div className="text-xs font-semibold mb-1">
                  {formatTime12Hour(slot)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {isMorning ? "AM" : "PM"}
                </div>
              </div>
            );
          })}
        </div>

        {generateTimeSlots().length > 8 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            ... and {generateTimeSlots().length - 8} more slots
          </p>
        )}
      </Card>

      {/* Slot Generation Summary */}
      <Card className="p-6 bg-muted/50 border-2 border-dashed">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Slot Generation Summary</h4>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Effective working time:</span>
                <span className="font-semibold">{slotInfo.totalWorkingTime}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Slot interval:</span>
                <span className="font-semibold">{slotInterval} minutes</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm font-medium">Total slots per day:</span>
                <span className="text-3xl font-bold">
                  {slotInfo.totalSlots}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              These start times will repeat daily. Customers can book any service at these times.
            </p>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-muted/30">
        <h4 className="mb-2 font-semibold text-sm">What happens next?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• We'll generate start times based on your settings</li>
          <li>• Start times repeat daily - no need to regenerate</li>
          <li>• Customers select a service + date + start time to book</li>
          <li>• You can add/remove start times anytime from Availability page</li>
        </ul>
      </Card>
    </div>
  );
}
