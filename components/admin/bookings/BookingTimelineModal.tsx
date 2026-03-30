import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingHistoryTimeline } from "@/components/customer/bookings/BookingHistoryTimeline";
import { History as HistoryIcon } from "lucide-react";

interface BookingTimelineModalProps {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey?: number;
}

export function BookingTimelineModal({
  bookingId,
  open,
  onOpenChange,
  refreshKey,
}: BookingTimelineModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl pb-2 border-b">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Booking Timeline
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {bookingId ? (
            <BookingHistoryTimeline bookingId={bookingId} refreshKey={refreshKey} />
          ) : (
            <p className="text-center text-muted-foreground">
              No booking selected.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
