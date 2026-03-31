"use client";

import { useState, useEffect } from "react";
import { Power, CheckCircle, AlertTriangle } from "lucide-react";
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
import { api, API_ENDPOINTS } from "@/lib/api";
import { deactivateService, activateService } from "@/lib/admin/business";

interface ServiceActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: number;
  serviceName: string;
  isActive: boolean; // Current state of the service
  onActionCompleted?: () => void;
}

export function ServiceActionDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  isActive,
  onActionCompleted,
}: ServiceActionDialogProps) {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset reason when dialog opens
  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  // Dialog title and button text based on current state
  const isDeactivateAction = isActive; // If active, we will deactivate

  const handleAction = async () => {
    // For deactivation, reason is required
    if (isDeactivateAction && !reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setIsProcessing(true);
    try {
      if (isDeactivateAction) {
        // Deactivate the service
        await deactivateService(serviceId, reason.trim());
        toast.success("Service deactivated", {
          description: `Customers can no longer book ${serviceName}`,
        });
      } else {
        // Reactivate the service
        await activateService(serviceId);
        toast.success("Service reactivated", {
          description: `${serviceName} is now available for booking`,
        });
      }
      setReason("");
      onOpenChange(false);
      onActionCompleted?.();
    } catch (error: any) {
      // Handle specific error messages
      if (error.message?.includes("already deactivated")) {
        toast.error("Service is already deactivated");
      } else if (error.message?.includes("already active")) {
        toast.error("Service is already active");
      } else {
        toast.error(
          isDeactivateAction
            ? "Failed to deactivate service"
            : "Failed to reactivate service",
          {
            description: error.message || "Please try again",
          },
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle
            className={`flex items-center gap-2 ${isDeactivateAction ? "text-orange-600" : "text-green-600"}`}
          >
            {isDeactivateAction ? (
              <>
                <Power className="h-4 w-4" />
                Deactivate Service
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Reactivate Service
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isDeactivateAction ? (
              <>
                Prevent customers from booking <strong>{serviceName}</strong>.
                Other services will remain available.
              </>
            ) : (
              <>
                Make <strong>{serviceName}</strong> available for customer
                bookings again.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isDeactivateAction && (
            <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                  Consequences:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  <li>Provider will be notified</li>
                  <li>Existing bookings continue normally</li>
                </ul>
              </div>
            </div>
          )}

          {isDeactivateAction && (
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
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className={
              isDeactivateAction
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
            }
            onClick={handleAction}
            disabled={isProcessing || (isDeactivateAction && !reason.trim())}
          >
            {isProcessing
              ? "Processing..."
              : isDeactivateAction
                ? "Deactivate"
                : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
