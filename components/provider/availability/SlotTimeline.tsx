/**
 * Slot Timeline Component
 * Visual timeline view for displaying slot start times
 */

import { Loader2, Clock } from "lucide-react";
import { SlotCard } from "./SlotCard";
import type { Slot } from "@/lib/provider/slots";
import { formatSlotTime } from "@/lib/provider/slots";

interface SlotTimelineProps {
  slots: Slot[];
  isLoading: boolean;
  onDelete: (slotId: number) => void;
}

export function SlotTimeline({ slots, isLoading, onDelete }: SlotTimelineProps) {
  // Timeline runs from 6:00 AM to 10:00 PM (16 hours)
  const START_HOUR = 6;
  const END_HOUR = 22;
  const TOTAL_HOURS = END_HOUR - START_HOUR;

  const getSlotPosition = (startTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);

    // Convert to decimal hours
    const startDecimal = startHour + startMin / 60;

    // Calculate position as percentage (width is minimal - just a marker)
    const left = ((startDecimal - START_HOUR) / TOTAL_HOURS) * 100;

    return { left };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading slots...</p>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Clock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No start times configured</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You haven't created any start times yet. Click "Add Slot" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="relative">
        {/* Hour markers */}
        <div className="flex justify-between text-xs text-muted-foreground mb-2 px-1">
          {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
            const hour = START_HOUR + i;
            return (
              <span key={hour}>
                {hour.toString().padStart(2, "0")}:00
              </span>
            );
          })}
        </div>

        {/* Timeline Track */}
        <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden">
          {/* Hour grid lines */}
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-border/50"
              style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
            />
          ))}

          {/* Slot Markers */}
          {slots.map((slot) => {
            const position = getSlotPosition(slot.startTime);
            return (
              <div
                key={slot.id}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${position.left}%` }}
                title={formatSlotTime(slot.startTime)}
              >
                <div className="w-3 h-3 rounded-full bg-primary hover:bg-primary/80 cursor-pointer transition-colors" />
                {position.left > 5 && position.left < 95 && (
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {formatSlotTime(slot.startTime)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Details List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Start Times</h3>
        {slots.map((slot) => (
          <SlotCard key={slot.id} slot={slot} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
