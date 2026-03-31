"use client";

import { useState } from "react";
import { Loader2, XCircle, Info, Divide } from "lucide-react";
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
  status?: string; // "pending" or "confirmed"
  totalPrice?: number; // in rupees
  onCancel?: () => void;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function CancelBookingButton({
  bookingId,
  status = "pending",
  totalPrice = 0,
  onCancel,
  variant = "button",
  size = "sm",
  className = "",
}: CancelBookingButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Calculate refund based on status
  const getRefundInfo = () => {
    if (status === "confirmed") {
      const refundAmount = Math.round((totalPrice * 85) / 100);
      const providerAmount = totalPrice - refundAmount;
      return {
        percentage: 85,
        amount: refundAmount,
        providerAmount,
      };
    } else {
      // Pending or reschedule_pending
      return {
        percentage: 100,
        amount: totalPrice,
        providerAmount: 0,
      };
    }
  };

  const refundInfo = getRefundInfo();

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await cancelBookingApi(bookingId, "Cancelled by customer");
      toast.success("Booking cancelled successfully");
      setShowDialog(false);
      onCancel?.();
    } catch (error: any) {
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
                {status === "confirmed" ? (
                  <>
                    <p className="text-sm">
                      You will receive{" "}
                      <strong className="font-semibold">
                        ₹{refundInfo.amount}
                      </strong>{" "}
                      (85% refund)
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-900">
                            Refund Details:
                          </p>
                          <ul className="list-disc list-inside text-amber-800 mt-1 space-y-1">
                            <li>You receive: ₹{refundInfo.amount} (85%)</li>
                            <li>
                              Provider keeps: ₹{refundInfo.providerAmount} (15%)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm">
                    You will receive a{" "}
                    <strong className="font-semibold">
                      full refund of ₹{refundInfo.amount}
                    </strong>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Go Back
              </AlertDialogCancel>
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
              {status === "confirmed" ? (
                <>
                  <p className="text-sm">
                    You will receive{" "}
                    <strong className="font-semibold">
                      ₹{refundInfo.amount}
                    </strong>{" "}
                    (85% refund)
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">
                          Refund Details:
                        </p>
                        <div className="list-disc list-inside text-amber-800 mt-1 space-y-1">
                          <p>You receive: ₹{refundInfo.amount} (85%)</p>
                          {/* <li>Provider keeps: ₹{refundInfo.providerAmount} (15%)</li> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm">
                  You will receive a{" "}
                  <strong className="font-semibold">
                    full refund of ₹{refundInfo.amount}
                  </strong>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Go Back
            </AlertDialogCancel>
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
