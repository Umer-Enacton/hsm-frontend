/**
 * Slot Card Component
 * Individual slot card for list view (start time only)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, MoreHorizontal, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Slot } from "@/lib/provider/slots";
import { formatSlotTime } from "@/lib/provider/slots";

interface SlotCardProps {
  slot: Slot;
  onDelete: (slotId: number) => void;
}

export function SlotCard({ slot, onDelete }: SlotCardProps) {
  const handleDelete = () => {
    onDelete(slot.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Time Icon */}
            <div className="rounded-full bg-primary/10 p-3">
              <Clock className="h-5 w-5 text-primary" />
            </div>

            {/* Slot Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {formatSlotTime(slot.startTime)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Daily recurring start time
              </p>
              {slot.bookingCount !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {slot.bookingCount} booking{slot.bookingCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Slot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
