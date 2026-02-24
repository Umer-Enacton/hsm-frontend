"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Clock, Coffee, Info } from "lucide-react";
import { WorkingHours, BreakTime } from "@/types/provider";

interface Stage2WorkingHoursProps {
  initialWorkingHours?: WorkingHours;
  initialBreakTime?: BreakTime;
  onNext: (data: {
    workingHours: WorkingHours;
    breakTime?: BreakTime;
  }) => void;
}

export function Stage2WorkingHours({
  initialWorkingHours = { startTime: "09:00", endTime: "18:00" },
  initialBreakTime,
  onNext,
}: Stage2WorkingHoursProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(initialWorkingHours);
  const [breakTime, setBreakTime] = useState<BreakTime | undefined>(initialBreakTime);
  const [hasBreak, setHasBreak] = useState(!!initialBreakTime);

  // Default break time if enabled
  const defaultBreakTime: BreakTime = { startTime: "14:00", endTime: "15:00" };

  // Track last notified data to prevent duplicate calls
  const lastNotifiedDataRef = useRef<string>("");

  useEffect(() => {
    const data = {
      workingHours,
      breakTime: hasBreak ? (breakTime || defaultBreakTime) : undefined,
    };
    const dataString = JSON.stringify(data);

    // Only notify if data has actually changed
    if (dataString !== lastNotifiedDataRef.current) {
      lastNotifiedDataRef.current = dataString;
      onNext(data);
    }
  }, [workingHours, breakTime, hasBreak, onNext]);

  // Helper: Convert "HH:mm" to minutes
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Format minutes to "Xh Ym"
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate working hours
  const calculateWorkTime = () => {
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);
    const totalMinutes = endMins - startMins;

    let breakMinutes = 0;
    if (hasBreak && breakTime) {
      breakMinutes = timeToMinutes(breakTime.endTime) - timeToMinutes(breakTime.startTime);
    }

    const effectiveMinutes = Math.max(0, totalMinutes - breakMinutes);

    return {
      totalWorkTime: formatMinutes(totalMinutes),
      breakTime: hasBreak ? formatMinutes(breakMinutes) : null,
      effectiveWorkTime: formatMinutes(effectiveMinutes),
    };
  };

  const workTime = calculateWorkTime();

  const handleToggleBreak = (enabled: boolean) => {
    setHasBreak(enabled);
    if (enabled && !breakTime) {
      setBreakTime(defaultBreakTime);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
              Working Hours Configuration
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Set your general working hours that apply to all days. Optionally add a break time.
              These hours will be used to generate availability slots in the next step.
            </p>
          </div>
        </div>
      </Card>

      {/* Working Hours */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Working Hours</Label>
        <p className="text-sm text-muted-foreground">
          These hours apply to all days
        </p>

        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Start time:</span>
          <Input
            type="time"
            value={workingHours.startTime}
            onChange={(e) => setWorkingHours({ ...workingHours, startTime: e.target.value })}
            className="w-32"
          />
          <span className="text-muted-foreground">to</span>
          <span className="text-sm">End time:</span>
          <Input
            type="time"
            value={workingHours.endTime}
            onChange={(e) => setWorkingHours({ ...workingHours, endTime: e.target.value })}
            className="w-32"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Total working time: {workTime.totalWorkTime} per day
        </div>
      </div>

      {/* Break Time */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Add Break Time (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Add a break period when you're not available for bookings
            </p>
          </div>
          <Switch
            checked={hasBreak}
            onCheckedChange={handleToggleBreak}
          />
        </div>

        {hasBreak && (
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            <Coffee className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Break time:</span>
            <Input
              type="time"
              value={breakTime?.startTime || defaultBreakTime.startTime}
              onChange={(e) =>
                setBreakTime({ ...(breakTime || defaultBreakTime), startTime: e.target.value })
              }
              className="w-32"
            />
            <span>to</span>
            <Input
              type="time"
              value={breakTime?.endTime || defaultBreakTime.endTime}
              onChange={(e) =>
                setBreakTime({ ...(breakTime || defaultBreakTime), endTime: e.target.value })
              }
              className="w-32"
            />
            <span className="text-sm text-muted-foreground ml-2">
              ({workTime.breakTime})
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      {hasBreak && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-4">
          <div className="text-sm">
            <span className="font-medium">Effective working time: </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {workTime.effectiveWorkTime} per day
            </span>
            <span className="text-muted-foreground"> (excluding break time)</span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium text-sm">Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Set realistic hours that you can commit to</li>
          <li>• These hours will apply to all working days</li>
          <li>• In the next step, you'll select the slot interval for bookings</li>
          <li>• Break times will be excluded from available booking slots</li>
        </ul>
      </div>
    </div>
  );
}
