"use client";

import { useState } from "react";
import { Loader2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelBooking as cancelBookingApi } from "@/lib/customer/api";
import { toast } from "sonner";

interface CancelBookingButtonProps {
  bookingId: number;
  totalPrice?: number; // in rupees
  bookingDate?: string;
  bookingTime?: string; // added for accurate timing
  status?: string;
  onCancel?: () => void;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function CancelBookingButton({
  bookingId,
  totalPrice = 0,
  bookingDate,
  bookingTime,
  onCancel,
  variant = "button",
  size = "sm",
  className = "",
}: CancelBookingButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Calculate refund based on time remaining matching the backend
  const getRefundInfo = () => {
    let percentage = 100;

    if (bookingDate) {
      // Create date object from bookingDate string
      const slotDate = new Date(bookingDate);
      
      // If time is provided, set it to the slotDate (local time)
      if (bookingTime) {
        const [hours, minutes] = bookingTime.split(":").map(Number);
        slotDate.setHours(hours, minutes, 0, 0);
      }

      const now = new Date();
      const timeRemainingMs = slotDate.getTime() - now.getTime();
      const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);

      if (hoursRemaining >= 24) {
        percentage = 100;
      } else if (hoursRemaining >= 12) {
        percentage = 75;
      } else if (hoursRemaining >= 4) {
        percentage = 50;
      } else if (hoursRemaining >= 0.5) {
        percentage = 25;
      } else {
        percentage = 0; // cannot cancel
      }
    }

    const amount = Math.round((totalPrice * percentage) / 100);
    return {
      percentage,
      amount,
      isCancelable: percentage > 0,
    };
  };

  const refundInfo = getRefundInfo();

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelBookingApi(bookingId, "Cancelled by customer");
      toast.success("Booking cancelled successfully");
      setShowDialog(false);
      onCancel?.();
    } catch (error: Error | any) {
      console.error("Cancel booking error:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  if (variant === "dropdown") {
    return (
      <>
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Cancel Booking?
              </AlertDialogTitle>
              <div className="space-y-3 py-3">
                {refundInfo.isCancelable ? (
                  <>
                    <p className="text-sm">
                      You will receive{" "}
                      <strong className="font-semibold">
                        ₹{refundInfo.amount}
                      </strong>{" "}
                      ({refundInfo.percentage}% refund)
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">
                            Refund Details:
                          </p>
                          <ul className="list-disc list-inside text-amber-800 mt-1 space-y-1">
                            <li>You receive: ₹{refundInfo.amount} ({refundInfo.percentage}%)</li>
                            <li>The closer to the appointment time, the less the refund.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">
                          Cancellation not allowed
                        </p>
                        <p className="text-red-800 mt-1 space-y-1">
                          You cannot cancel a booking less than 30 minutes before the scheduled time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {refundInfo.isCancelable && (
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Go Back
              </AlertDialogCancel>
              {refundInfo.isCancelable && (
                <AlertDialogAction
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Yes, Cancel Booking"
                  )}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <button
          onClick={() => setShowDialog(true)}
          disabled={isCancelling}
          className={className}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Booking
        </button>
      </>
    );
  }

  return (
    <>
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel Booking?
            </AlertDialogTitle>
            <div className="space-y-3 py-3">
              {refundInfo.isCancelable ? (
                <>
                  <p className="text-sm">
                    You will receive{" "}
                    <strong className="font-semibold">
                      ₹{refundInfo.amount}
                    </strong>{" "}
                    ({refundInfo.percentage}% refund)
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">
                          Refund Details:
                        </p>
                        <div className="list-disc list-inside text-amber-800 mt-1 space-y-1">
                          <p>You receive: ₹{refundInfo.amount} ({refundInfo.percentage}%)</p>
                          <p>The closer to the appointment time, the less the refund.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">
                        Cancellation not allowed
                      </p>
                      <p className="text-red-800 mt-1 space-y-1">
                        You cannot cancel a booking less than 30 minutes before the scheduled time.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {refundInfo.isCancelable && (
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Go Back
            </AlertDialogCancel>
            {refundInfo.isCancelable && (
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Booking"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        size={size}
        variant="destructive"
        onClick={() => setShowDialog(true)}
        disabled={isCancelling}
        className={className}
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel Booking
      </Button>
    </>
  );
}
