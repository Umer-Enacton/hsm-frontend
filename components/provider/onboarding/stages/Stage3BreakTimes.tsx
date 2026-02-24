"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Clock, Coffee } from "lucide-react";
import { BreakTime, WorkingHours, DayOfWeek } from "@/types/provider";
import { cn } from "@/lib/utils";

const DAYS = [
  { label: "Monday", value: DayOfWeek.MONDAY },
  { label: "Tuesday", value: DayOfWeek.TUESDAY },
  { label: "Wednesday", value: DayOfWeek.WEDNESDAY },
  { label: "Thursday", value: DayOfWeek.THURSDAY },
  { label: "Friday", value: DayOfWeek.FRIDAY },
  { label: "Saturday", value: DayOfWeek.SATURDAY },
  { label: "Sunday", value: DayOfWeek.SUNDAY },
];

interface BreakTimeEntry {
  id: string;
  day?: DayOfWeek; // If undefined, applies to all days
  startTime: string;
  endTime: string;
}

interface Stage3BreakTimesProps {
  initialData?: BreakTime[];
  workingHours: WorkingHours[];
  onNext: (data: BreakTime[]) => void;
}

export function Stage3BreakTimes({
  initialData = [],
  workingHours = [],
  onNext,
}: Stage3BreakTimesProps) {
  const [breakTimes, setBreakTimes] = useState<BreakTimeEntry[]>(() => {
    if (initialData.length > 0) {
      return initialData.map((bt, idx) => ({
        id: `bt-${idx}`,
        day: bt.day,
        startTime: bt.startTime,
        endTime: bt.endTime,
      }));
    }
    return [];
  });

  const [globalBreakEnabled, setGlobalBreakEnabled] = useState(false);
  const [globalBreakStart, setGlobalBreakStart] = useState("12:00");
  const [globalBreakEnd, setGlobalBreakEnd] = useState("13:00");

  // Notify parent of changes
  useEffect(() => {
    const breakData: BreakTime[] = breakTimes.map((bt) => ({
      businessId: 0,
      day: bt.day,
      startTime: bt.startTime,
      endTime: bt.endTime,
    }));
    onNext(breakData);
  }, [breakTimes]);

  const openDays = workingHours
    .filter((wh) => wh.isOpen)
    .map((wh) => wh.day);

  const addBreakForAllDays = () => {
    const newBreak: BreakTimeEntry = {
      id: `bt-${Date.now()}`,
      startTime: globalBreakStart,
      endTime: globalBreakEnd,
    };
    setBreakTimes((prev) => [...prev, newBreak]);
    setGlobalBreakEnabled(true);
  };

  const addBreakForDay = (day: DayOfWeek) => {
    const newBreak: BreakTimeEntry = {
      id: `bt-${Date.now()}`,
      day,
      startTime: "12:00",
      endTime: "13:00",
    };
    setBreakTimes((prev) => [...prev, newBreak]);
  };

  const removeBreak = (id: string) => {
    setBreakTimes((prev) => prev.filter((bt) => bt.id !== id));
  };

  const updateBreakTime = (
    id: string,
    field: "startTime" | "endTime" | "day",
    value: string | DayOfWeek
  ) => {
    setBreakTimes((prev) =>
      prev.map((bt) =>
        bt.id === id ? { ...bt, [field]: value } : bt
      )
    );
  };

  const getBreakLabel = (bt: BreakTimeEntry) => {
    if (bt.day === undefined) {
      return "All Days";
    }
    return DAYS.find((d) => d.value === bt.day)?.label || bt.day;
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <Coffee className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            Configure Break Times (Optional)
          </h4>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            Set break times when you're not available for bookings. You can skip
            this step and configure breaks later in your settings.
          </p>
        </div>
      </div>

      {/* Global Break for All Days */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Add a Default Break</Label>
            <p className="text-sm text-muted-foreground">
              This break will apply to all working days
            </p>
          </div>
          <Switch
            checked={globalBreakEnabled}
            onCheckedChange={(checked) => {
              setGlobalBreakEnabled(checked);
              if (checked && !breakTimes.some((bt) => bt.day === undefined)) {
                addBreakForAllDays();
              } else if (!checked) {
                setBreakTimes((prev) => prev.filter((bt) => bt.day !== undefined));
              }
            }}
          />
        </div>

        {globalBreakEnabled && (
          <div className="mt-4 flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Break time:</span>
            <Input
              type="time"
              value={globalBreakStart}
              onChange={(e) => {
                setGlobalBreakStart(e.target.value);
                setBreakTimes((prev) =>
                  prev.map((bt) =>
                    bt.day === undefined
                      ? { ...bt, startTime: e.target.value }
                      : bt
                  )
                );
              }}
              className="w-32"
            />
            <span>to</span>
            <Input
              type="time"
              value={globalBreakEnd}
              onChange={(e) => {
                setGlobalBreakEnd(e.target.value);
                setBreakTimes((prev) =>
                  prev.map((bt) =>
                    bt.day === undefined
                      ? { ...bt, endTime: e.target.value }
                      : bt
                  )
                );
              }}
              className="w-32"
            />
          </div>
        )}
      </div>

      {/* Day-Specific Breaks */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          Or add breaks for specific days
        </Label>

        <div className="grid gap-2 md:grid-cols-4">
          {DAYS.map((day) => {
            const isDayOpen = openDays.includes(day.value);
            const hasBreakForDay = breakTimes.some((bt) => bt.day === day.value);

            return (
              <Button
                key={day.value}
                variant={hasBreakForDay ? "default" : "outline"}
                size="sm"
                onClick={() => addBreakForDay(day.value)}
                disabled={!isDayOpen}
                className="justify-start"
              >
                <Plus className="mr-2 h-3 w-3" />
                {day.label}
                {!isDayOpen && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Closed
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* List of Break Times */}
      {breakTimes.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-medium">Configured Breaks</Label>

          <div className="space-y-2">
            {breakTimes.map((bt) => (
              <div
                key={bt.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getBreakLabel(bt)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {bt.startTime} - {bt.endTime}
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeBreak(bt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {breakTimes.length === 0 && !globalBreakEnabled && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Coffee className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            No break times configured yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add a break time or skip this step
          </p>
        </div>
      )}

      {/* Note */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Break times will block bookings during those
          hours. Customers can only book services outside of your configured
          break times.
        </p>
      </div>
    </div>
  );
}
