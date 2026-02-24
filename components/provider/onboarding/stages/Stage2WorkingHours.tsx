"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Clock, Copy } from "lucide-react";
import { WorkingHours, DayOfWeek } from "@/types/provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Monday", value: DayOfWeek.MONDAY },
  { label: "Tuesday", value: DayOfWeek.TUESDAY },
  { label: "Wednesday", value: DayOfWeek.WEDNESDAY },
  { label: "Thursday", value: DayOfWeek.THURSDAY },
  { label: "Friday", value: DayOfWeek.FRIDAY },
  { label: "Saturday", value: DayOfWeek.SATURDAY },
  { label: "Sunday", value: DayOfWeek.SUNDAY },
];

interface DayWorkingHours {
  day: DayOfWeek;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

interface Stage2WorkingHoursProps {
  initialData?: WorkingHours[];
  onNext: (data: WorkingHours[]) => void;
}

export function Stage2WorkingHours({
  initialData = [],
  onNext,
}: Stage2WorkingHoursProps) {
  // Initialize with default 9-5 for all days if no data
  const [weekHours, setWeekHours] = useState<DayWorkingHours[]>(() => {
    if (initialData.length > 0) {
      return DAYS.map((day) => {
        const existing = initialData.find((wh) => wh.day === day.value);
        return {
          day: day.value,
          isOpen: existing?.isOpen ?? day.value !== DayOfWeek.SUNDAY,
          startTime: existing?.startTime || "09:00",
          endTime: existing?.endTime || "17:00",
        };
      });
    }

    // Default: Mon-Fri 9-5, Sat-Sun closed
    return DAYS.map((day) => ({
      day: day.value,
      isOpen: day.value !== DayOfWeek.SATURDAY && day.value !== DayOfWeek.SUNDAY,
      startTime: "09:00",
      endTime: "17:00",
    }));
  });

  const [copiedFromDay, setCopiedFromDay] = useState<DayOfWeek | null>(null);

  // Notify parent of changes
  useEffect(() => {
    const workingHours: WorkingHours[] = weekHours.map((wh) => ({
      businessId: 0, // Will be set by backend
      day: wh.day,
      isOpen: wh.isOpen,
      startTime: wh.isOpen ? wh.startTime : undefined,
      endTime: wh.isOpen ? wh.endTime : undefined,
    }));
    onNext(workingHours);
  }, [weekHours]);

  const handleToggleDay = (dayIndex: number) => {
    setWeekHours((prev) =>
      prev.map((wh, idx) =>
        idx === dayIndex ? { ...wh, isOpen: !wh.isOpen } : wh
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setWeekHours((prev) =>
      prev.map((wh, idx) =>
        idx === dayIndex ? { ...wh, [field]: value } : wh
      )
    );
  };

  const copyToAllDays = (sourceDay: DayOfWeek) => {
    const sourceHours = weekHours.find((wh) => wh.day === sourceDay);
    if (!sourceHours) return;

    setWeekHours((prev) =>
      prev.map((wh) => ({
        ...wh,
        isOpen: sourceHours.isOpen,
        startTime: sourceHours.startTime,
        endTime: sourceHours.endTime,
      }))
    );

    setCopiedFromDay(sourceDay);
    toast.success("Working hours copied to all days");

    setTimeout(() => setCopiedFromDay(null), 2000);
  };

  const setWeekdays = () => {
    setWeekHours((prev) =>
      prev.map((wh) => {
        const isWeekend = wh.day === DayOfWeek.SATURDAY || wh.day === DayOfWeek.SUNDAY;
        return {
          ...wh,
          isOpen: !isWeekend,
          startTime: "09:00",
          endTime: "17:00",
        };
      })
    );
    toast.success("Weekday hours set (Mon-Fri: 9AM - 5PM)");
  };

  const setAllDays = () => {
    setWeekHours((prev) =>
      prev.map((wh) => ({
        ...wh,
        isOpen: true,
        startTime: "09:00",
        endTime: "17:00",
      }))
    );
    toast.success("All days set to 9AM - 5PM");
  };

  const hasAtLeastOneOpenDay = weekHours.some((wh) => wh.isOpen);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={setWeekdays}>
          Set Weekdays (Mon-Fri)
        </Button>
        <Button variant="outline" size="sm" onClick={setAllDays}>
          Set All Days
        </Button>
      </div>

      {/* Working Hours Grid */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Set your working hours for each day
        </Label>

        {weekHours.map((dayHours, index) => {
          const dayLabel = DAYS.find((d) => d.value === dayHours.day)?.label;
          const isWeekend =
            dayHours.day === DayOfWeek.SATURDAY || dayHours.day === DayOfWeek.SUNDAY;

          return (
            <div
              key={dayHours.day}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                !dayHours.isOpen && "bg-muted/30 opacity-60",
                dayHours.isOpen && "bg-background"
              )}
            >
              {/* Day Label */}
              <div className="w-32 font-medium">{dayLabel}</div>

              {/* Open/Close Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={dayHours.isOpen}
                  onCheckedChange={() => handleToggleDay(index)}
                />
                <span className="text-sm text-muted-foreground">
                  {dayHours.isOpen ? "Open" : "Closed"}
                </span>
              </div>

              {/* Time Inputs */}
              {dayHours.isOpen && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={dayHours.startTime}
                    onChange={(e) =>
                      handleTimeChange(index, "startTime", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={dayHours.endTime}
                    onChange={(e) =>
                      handleTimeChange(index, "endTime", e.target.value)
                    }
                    className="w-32"
                  />

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToAllDays(dayHours.day)}
                    title="Copy to all days"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Validation */}
      {!hasAtLeastOneOpenDay && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <span className="text-sm text-destructive">
            Please set at least one day as open
          </span>
        </div>
      )}

      {hasAtLeastOneOpenDay && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 p-4">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {weekHours.filter((wh) => wh.isOpen).length} days configured
          </span>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium">Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Set realistic hours that you can commit to</li>
          <li>• You can always adjust these later in your settings</li>
          <li>• Use the copy button to apply the same hours to all days</li>
          <li>• Break times can be configured in the next step (optional)</li>
        </ul>
      </div>
    </div>
  );
}
