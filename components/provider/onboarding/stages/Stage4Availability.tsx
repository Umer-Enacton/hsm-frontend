"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Sparkles, Info } from "lucide-react";
import { AvailabilitySlot, WorkingHours, BreakTime, SlotMode, DayOfWeek } from "@/types/provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = [
  { label: "Monday", value: DayOfWeek.MONDAY },
  { label: "Tuesday", value: DayOfWeek.TUESDAY },
  { label: "Wednesday", value: DayOfWeek.WEDNESDAY },
  { label: "Thursday", value: DayOfWeek.THURSDAY },
  { label: "Friday", value: DayOfWeek.FRIDAY },
  { label: "Saturday", value: DayOfWeek.SATURDAY },
  { label: "Sunday", value: DayOfWeek.SUNDAY },
];

interface AvailabilityData {
  mode: SlotMode;
  slots: AvailabilitySlot[];
  autoGenerateConfig?: {
    startDate: string;
    endDate: string;
    slotDuration: number;
    startTime: string;
    endTime: string;
    excludeDays: DayOfWeek[];
  };
}

interface Stage4AvailabilityProps {
  initialData?: AvailabilityData;
  workingHours: WorkingHours[];
  breakTimes: BreakTime[];
  onNext: (data: AvailabilityData) => void;
  preSelectedWorkingHours?: WorkingHours[];
}

export function Stage4Availability({
  initialData,
  workingHours = [],
  breakTimes = [],
  onNext,
  preSelectedWorkingHours = [],
}: Stage4AvailabilityProps) {
  const [mode, setMode] = useState<SlotMode>(initialData?.mode || SlotMode.AUTO);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialData?.slots || []);

  // Auto-generate config - pre-fill with working hours
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    return twoWeeks.toISOString().split('T')[0];
  });

  const [slotDuration, setSlotDuration] = useState(60);

  // Get default time from first working day
  const firstWorkingDay = preSelectedWorkingHours.find(wh => wh.isOpen);
  const [autoStartTime, setAutoStartTime] = useState(firstWorkingDay?.startTime || "09:00");
  const [autoEndTime, setAutoEndTime] = useState(firstWorkingDay?.endTime || "17:00");

  // Days that are closed (exclude from auto-generation)
  const closedDays = preSelectedWorkingHours
    .filter(wh => !wh.isOpen)
    .map(wh => wh.day);

  const [excludeDays, setExcludeDays] = useState<DayOfWeek[]>(closedDays);

  // Notify parent of changes
  useEffect(() => {
    const data: AvailabilityData = {
      mode,
      slots,
      autoGenerateConfig:
        mode === SlotMode.AUTO
          ? {
              startDate,
              endDate,
              slotDuration,
              startTime: autoStartTime,
              endTime: autoEndTime,
              excludeDays,
            }
          : undefined,
    };
    onNext(data);
  }, [mode, slots, startDate, endDate, slotDuration, autoStartTime, autoEndTime, excludeDays]);

  const generateAutoSlots = () => {
    const generatedSlots: AvailabilitySlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate slots for each day in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayIndex = d.getDay();
      const dayMap: Record<number, DayOfWeek> = {
        1: DayOfWeek.MONDAY,
        2: DayOfWeek.TUESDAY,
        3: DayOfWeek.WEDNESDAY,
        4: DayOfWeek.THURSDAY,
        5: DayOfWeek.FRIDAY,
        6: DayOfWeek.SATURDAY,
        0: DayOfWeek.SUNDAY,
      };

      const dayName = dayMap[dayIndex];

      // Skip excluded days or days that are closed
      if (excludeDays.includes(dayName)) continue;

      // Check if this day is open in working hours
      const dayWorkingHours = preSelectedWorkingHours.find((wh) => wh.day === dayName);
      if (!dayWorkingHours || !dayWorkingHours.isOpen) continue;

      // Use working hours for this day
      const dayStart = dayWorkingHours.startTime || autoStartTime;
      const dayEnd = dayWorkingHours.endTime || autoEndTime;

      // Generate time slots based on working hours
      let currentMinutes =
        parseInt(dayStart.split(':')[0]) * 60 + parseInt(dayStart.split(':')[1]);
      const endMinutes =
        parseInt(dayEnd.split(':')[0]) * 60 + parseInt(dayEnd.split(':')[1]);

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
        currentMinutes += slotDuration;
        const slotEnd = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;

        generatedSlots.push({
          businessId: 0,
          date: d.toISOString().split('T')[0],
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: false,
        });
      }
    }

    setSlots(generatedSlots);
    toast.success(`Generated ${generatedSlots.length} slots based on your working hours`);
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getOpenDays = () => {
    return preSelectedWorkingHours
      .filter(wh => wh.isOpen)
      .map(wh => {
        const dayInfo = DAYS.find(d => d.value === wh.day);
        return {
          day: wh.day,
          label: dayInfo?.label || wh.day,
          startTime: wh.startTime,
          endTime: wh.endTime,
        };
      });
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  const openDays = getOpenDays();

  return (
    <div className="space-y-6">
      {/* Working Hours Summary */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">Based on your working hours</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Slots will be generated for your working days only:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {openDays.map((day) => (
                <Badge key={day.day} variant="secondary" className="text-xs">
                  {day.label}: {day.startTime} - {day.endTime}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Mode Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Choose Slot Creation Mode</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={cn(
              "cursor-pointer border-2 transition-all hover:border-primary/50",
              mode === SlotMode.MANUAL && "border-muted bg-muted/30"
            )}
            onClick={() => setMode(SlotMode.MANUAL)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  mode === SlotMode.MANUAL ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                <div>
                  <h3 className="font-semibold">Manual Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Add individual slots as needed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className={cn(
              "cursor-pointer border-2 transition-all hover:border-primary/50",
              mode === SlotMode.AUTO && "border-primary bg-primary/5"
            )}
            onClick={() => setMode(SlotMode.AUTO)}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  mode === SlotMode.AUTO ? "border-primary bg-primary" : "border-muted-foreground"
                )} />
                <div>
                  <h3 className="font-semibold">Auto-Generate</h3>
                  <p className="text-sm text-muted-foreground">
                    Bulk create slots based on your working hours
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Manual Mode */}
      {mode === SlotMode.MANUAL && (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Manual slot creation is coming soon. For now, please use Auto-Generate mode.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setMode(SlotMode.AUTO)}
            >
              Switch to Auto-Generate
            </Button>
          </div>
        </div>
      )}

      {/* Auto Mode */}
      {mode === SlotMode.AUTO && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Slot Duration</Label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Default Start Time</Label>
              <Input
                type="time"
                value={autoStartTime}
                onChange={(e) => setAutoStartTime(e.target.value)}
                disabled={!!firstWorkingDay}
              />
              {firstWorkingDay && (
                <p className="text-xs text-muted-foreground">
                  From your working hours
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Default End Time</Label>
              <Input
                type="time"
                value={autoEndTime}
                onChange={(e) => setAutoEndTime(e.target.value)}
                disabled={!!firstWorkingDay}
              />
              {firstWorkingDay && (
                <p className="text-xs text-muted-foreground">
                  From your working hours
                </p>
              )}
            </div>
          </div>

          <Button onClick={generateAutoSlots} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Slots for Working Days
            {slots.length > 0 && ` (${slots.length} already)`}
          </Button>

          {slots.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-primary/5 p-4">
                <p className="text-sm font-medium">
                  {slots.length} slots generated
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  from {formatDate(startDate)} to {formatDate(endDate)}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Generated Slots (First 5 days)</Label>
                {Object.entries(groupedSlots).slice(0, 5).map(([date, daySlots]) => (
                  <Card key={date} className="p-3">
                    <div className="mb-2 font-medium text-sm">
                      {formatDate(date)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.slice(0, 5).map((slot, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.startTime} - {slot.endTime}
                        </Badge>
                      ))}
                      {daySlots.length > 5 && (
                        <Badge variant="outline" className="px-3 py-1">
                          +{daySlots.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium">Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Slots are generated based on your working hours from Stage 2</li>
          <li>• Closed days are automatically excluded</li>
          <li>• You can adjust slots anytime from the Availability page</li>
          <li>• Customers can only book during your available slots</li>
        </ul>
      </div>
    </div>
  );
}
