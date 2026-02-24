/**
 * Slot Dialog Component
 * Add/Edit slot dialog with 12-hour AM/PM time picker
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Info } from "lucide-react";

interface SlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { startTime: string }) => void | Promise<void>;
  businessId?: number | null;
}

export function SlotDialog({
  open,
  onOpenChange,
  onSubmit,
  businessId,
}: SlotDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - 12-hour format
  const [hour, setHour] = useState("9"); // 1-12
  const [minute, setMinute] = useState("00"); // 00, 15, 30, 45
  const [period, setPeriod] = useState<"AM" | "PM">("AM"); // AM or PM

  // Reset form when dialog opens
  const resetForm = () => {
    setHour("9");
    setMinute("00");
    setPeriod("AM");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert 12-hour to 24-hour format for backend
    let hour24 = parseInt(hour);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    // Build time string in "HH:mm:ss" format
    const startTime = `${hour24.toString().padStart(2, "0")}:${minute}:00`;

    setIsSubmitting(true);

    try {
      await onSubmit({ startTime });
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPreviewTime = () => {
    return `${hour}:${minute} ${period}`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Time Slot</DialogTitle>
          <DialogDescription>
            Add a time when customers can start bookings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Time Selector */}
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <div className="flex items-center gap-2">
                {/* Hour (1-12) */}
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h.toString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground">:</span>

                {/* Minute (00, 15, 30, 45) */}
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="00">00</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="45">45</SelectItem>
                  </SelectContent>
                </Select>

                {/* AM/PM */}
                <Select value={period} onValueChange={(value: "AM" | "PM") => setPeriod(value)}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Preview</span>
              </div>
              <p className="text-lg font-bold">{formatPreviewTime()}</p>
              <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Customers can book services starting at <strong>{formatPreviewTime()}</strong>.
                  This time slot will be available every day.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Time Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
