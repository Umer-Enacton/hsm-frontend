/**
 * Slot List Component
 * List view for displaying slot cards
 */

import { Loader2, Clock } from "lucide-react";
import { SlotCard } from "./SlotCard";
import type { Slot } from "@/lib/provider/slots";

interface SlotListProps {
  slots: Slot[];
  isLoading: boolean;
  onDelete: (slotId: number) => void;
}

export function SlotList({ slots, isLoading, onDelete }: SlotListProps) {
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
        <h3 className="text-lg font-semibold mb-2">No time slots configured</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You haven't created any time slots yet. Click "Add Slot" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <SlotCard key={slot.id} slot={slot} onDelete={onDelete} />
      ))}
    </div>
  );
}
