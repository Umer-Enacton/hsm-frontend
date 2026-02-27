"use client";

import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Clock, Coffee, Sun, Moon } from "lucide-react";
import { WorkingHours, BreakTime } from "@/types/provider";
import { cn } from "@/lib/utils";

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

  const defaultBreakTime: BreakTime = { startTime: "13:00", endTime: "14:00" };
  const lastNotifiedDataRef = useRef<string>("");

  useEffect(() => {
    const data = {
      workingHours,
      breakTime: hasBreak ? (breakTime || defaultBreakTime) : undefined,
    };
    const dataString = JSON.stringify(data);

    if (dataString !== lastNotifiedDataRef.current) {
      lastNotifiedDataRef.current = dataString;
      onNext(data);
    }
  }, [workingHours, breakTime, hasBreak, onNext]);

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime12Hour = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateWorkTime = () => {
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);
    const totalMinutes = endMins - startMins;

    let breakMinutes = 0;
    if (hasBreak && breakTime) {
      breakMinutes = timeToMinutes(breakTime.endTime) - timeToMinutes(breakTime.startTime);
    }

    const effectiveMinutes = totalMinutes - breakMinutes;

    return {
      totalWorkTime: formatMinutes(totalMinutes),
      breakTime: formatMinutes(breakMinutes),
      effectiveWorkTime: formatMinutes(effectiveMinutes),
      totalMinutes,
      breakMinutes,
      effectiveMinutes,
    };
  };

  const workTime = calculateWorkTime();

  const handleToggleBreak = (enabled: boolean) => {
    setHasBreak(enabled);
    if (enabled && !breakTime) {
      setBreakTime(defaultBreakTime);
    }
  };

  // Timeline calculation (0 = midnight, 1440 = 24h in minutes)
  const renderTimeline = () => {
    const startMins = timeToMinutes(workingHours.startTime);
    const endMins = timeToMinutes(workingHours.endTime);
    const dayStart = 0; // 00:00
    const dayEnd = 1440; // 24:00

    // Work block
    const workPercent = ((endMins - startMins) / (dayEnd - dayStart)) * 100;
    const workLeftPercent = (startMins / (dayEnd - dayStart)) * 100;

    // Break block
    let breakLeftPercent = 0;
    let breakWidthPercent = 0;
    if (hasBreak && breakTime) {
      const breakStart = timeToMinutes(breakTime.startTime);
      const breakEnd = timeToMinutes(breakTime.endTime);
      breakLeftPercent = (breakStart / (dayEnd - dayStart)) * 100;
      breakWidthPercent = ((breakEnd - breakStart) / (dayEnd - dayStart)) * 100;
    }

    return (
      <div className="relative h-12 bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden">
        {/* Work hours block */}
        <div
          className="absolute h-full bg-neutral-800 dark:bg-neutral-700"
          style={{
            left: `${workLeftPercent}%`,
            width: `${workPercent}%`,
          }}
        />

        {/* Break block */}
        {hasBreak && breakTime && (
          <div
            className="absolute h-full bg-neutral-400 dark:bg-neutral-600"
            style={{
              left: `${breakLeftPercent}%`,
              width: `${breakWidthPercent}%`,
            }}
          />
        )}

        {/* Time markers */}
        <div className="absolute inset-0 flex justify-between px-2">
          <span className="text-xs text-muted-foreground">12 AM</span>
          <span className="text-xs text-muted-foreground">12 PM</span>
          <span className="text-xs text-muted-foreground">11:59 PM</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Working Hours</h3>
        <p className="text-sm text-muted-foreground">
          Set your general working hours that apply to all days
        </p>
      </div>

      {/* Working Hours Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-semibold">Working Hours</Label>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm text-muted-foreground w-20">Start time:</span>
            <Input
              type="time"
              value={workingHours.startTime}
              onChange={(e) => setWorkingHours({ ...workingHours, startTime: e.target.value })}
              className="w-40"
            />
          </div>

          <div className="hidden sm:block text-muted-foreground">—</div>

          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm text-muted-foreground w-20">End time:</span>
            <Input
              type="time"
              value={workingHours.endTime}
              onChange={(e) => setWorkingHours({ ...workingHours, endTime: e.target.value })}
              className="w-40"
            />
          </div>
        </div>

        {/* Work Time Summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total working time:</span>
            <span className="font-semibold">{workTime.totalWorkTime} per day</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>({formatTime12Hour(workingHours.startTime)} - {formatTime12Hour(workingHours.endTime)})</span>
          </div>
        </div>
      </Card>

      {/* Break Time Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-semibold">Break Time</Label>
              <p className="text-xs text-muted-foreground">Optional - when you're not available</p>
            </div>
          </div>
          <Switch checked={hasBreak} onCheckedChange={handleToggleBreak} />
        </div>

        {hasBreak && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-muted-foreground w-20">Break from:</span>
                <Input
                  type="time"
                  value={breakTime?.startTime || defaultBreakTime.startTime}
                  onChange={(e) =>
                    setBreakTime({ ...(breakTime || defaultBreakTime), startTime: e.target.value })
                  }
                  className="w-40"
                />
              </div>

              <div className="hidden sm:block text-muted-foreground">—</div>

              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-muted-foreground w-20">Break until:</span>
                <Input
                  type="time"
                  value={breakTime?.endTime || defaultBreakTime.endTime}
                  onChange={(e) =>
                    setBreakTime({ ...(breakTime || defaultBreakTime), endTime: e.target.value })
                  }
                  className="w-40"
                />
              </div>
            </div>

            {/* Break Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">Break duration:</span>
                <span className="font-semibold">{workTime.breakTime}</span>
              </div>
            </div>
          </div>
        )}

        {!hasBreak && (
          <div className="p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
            No break time configured
          </div>
        )}
      </Card>

      {/* Daily Timeline Card */}
      <Card className="p-6">
        <div className="mb-4">
          <Label className="text-base font-semibold">Daily Timeline Preview</Label>
          <p className="text-xs text-muted-foreground mt-1">Visual representation of your work day</p>
        </div>

        {/* Timeline Bar */}
        {renderTimeline()}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-800 dark:bg-neutral-700" />
            <span>Working hours ({workTime.totalWorkTime})</span>
          </div>
          {hasBreak && breakTime && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-neutral-400 dark:bg-neutral-600" />
              <span>Break ({workTime.breakTime})</span>
            </div>
          )}
        </div>
      </Card>

      {/* Effective Work Time Summary */}
      {hasBreak && (
        <Card className="p-4 bg-muted/50 border-2 border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Effective working time:</span>
            </div>
            <span className="text-lg font-bold">{workTime.effectiveWorkTime} per day</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            (Total working time excluding break time)
          </p>
        </Card>
      )}
    </div>
  );
}
