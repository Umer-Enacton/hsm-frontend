"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface CancelRescheduleButtonProps {
  bookingId: number;
  onCancel?: () => void;
  variant?: "expanded" | "dropdown";
  className?: string;
}

export function CancelRescheduleButton({
  bookingId,
  onCancel,
  variant = "expanded",
  className = "",
}: CancelRescheduleButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleCancelReschedule = async () => {
    setIsCancelling(true);
    try {
      await api.put(`/booking/${bookingId}/cancel-reschedule`, {});
      toast.success("Reschedule request cancelled successfully");
      setShowDialog(false);
      onCancel?.();
    } catch (error: any) {
      console.error("Failed to cancel reschedule:", error);
      toast.error(
        error.response?.data?.message || "Failed to cancel reschedule request"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (variant === "dropdown") {
    return (
      <>
        <button
          onClick={() => setShowDialog(true)}
          disabled={isCancelling}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel Reschedule
        </button>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Reschedule Request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel your reschedule request and restore the original booking time.
                Any reschedule fee paid will be refunded.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Keep Reschedule
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelReschedule();
                }}
                disabled={isCancelling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCancelling ? "Cancelling..." : "Cancel Reschedule"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={isCancelling}
        className={className}
      >
        <X className="h-4 w-4 mr-2" />
        Cancel Reschedule
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Reschedule Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your reschedule request and restore the original booking time.
              Any reschedule fee paid will be refunded to your original payment method.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Reschedule
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelReschedule();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Cancel Reschedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
