"use client";

import { useState } from "react";
import { Ban, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface BlockBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: number;
  businessName: string;
  onBlocked?: () => void;
}

export function BlockBusinessDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  onBlocked,
}: BlockBusinessDialogProps) {
  const [reason, setReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for blocking this business");
      return;
    }

    setIsBlocking(true);
    try {
      const { blockBusiness } = await import("@/lib/admin/business");
      await blockBusiness(businessId, reason.trim());
      toast.success("Business blocked successfully", {
        description: `${businessName} can no longer receive new bookings`,
      });
      setReason("");
      onOpenChange(false);
      onBlocked?.();
    } catch (error: any) {
      toast.error("Failed to block business", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-4 w-4" />
            Block Business
          </DialogTitle>
          <DialogDescription className="text-sm">
            This will prevent <strong>{businessName}</strong> from receiving new
            bookings. Existing bookings will continue as normal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs text-destructive">
              <p className="font-semibold mb-1">Blocking consequences:</p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Customers cannot see or book services</li>
                <li>Provider will see a notification</li>
                <li>Existing bookings remain unaffected</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="E.g., Violation of platform policies, customer complaints, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isBlocking}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBlock}
            disabled={isBlocking || !reason.trim()}
          >
            {isBlocking ? "Blocking..." : "Block Business"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
