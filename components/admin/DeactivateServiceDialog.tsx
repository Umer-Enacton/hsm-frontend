"use client";

import { useState } from "react";
import { AlertTriangle, Power } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface DeactivateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: number;
  serviceName: string;
  onDeactivated?: () => void;
}

export function DeactivateServiceDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  onDeactivated,
}: DeactivateServiceDialogProps) {
  const [reason, setReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for deactivating this service");
      return;
    }

    setIsDeactivating(true);
    try {
      const { deactivateService } = await import("@/lib/admin/business");
      await deactivateService(serviceId, reason.trim());
      toast.success("Service deactivated successfully", {
        description: `Customers can no longer book ${serviceName}`,
      });
      setReason("");
      onOpenChange(false);
      onDeactivated?.();
    } catch (error: any) {
      toast.error("Failed to deactivate service", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Power className="h-4 w-4" />
            Deactivate Service
          </DialogTitle>
          <DialogDescription className="text-sm">
            This will prevent customers from booking <strong>{serviceName}</strong>.
            Other services will remain available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                Deactivation consequences:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Customers cannot book this service</li>
                <li>Provider will see a notification</li>
                <li>Existing bookings continue normally</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-reason" className="text-sm">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="service-reason"
              placeholder="E.g., Quality issues, temporarily unavailable, etc."
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
            disabled={isDeactivating}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleDeactivate}
            disabled={isDeactivating || !reason.trim()}
          >
            {isDeactivating ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
