"use client";

import { useState } from "react";
import {
  Check,
  X,
  Loader2,
  CalendarDays,
  Clock,
  AlertTriangle,
  History as HistoryIcon,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAfterBookingAction } from "@/lib/queries/query-invalidation";

interface ReschedulePendingActionsProps {
  bookingId: number;
  rescheduleReason: string | null;
  newDate: string;
  newTime: string;
  previousDate?: string | null;
  previousTime?: string | null;
  onActionComplete?: () => void;
  variant?: "row" | "expanded";
}

export function ReschedulePendingActions({
  bookingId,
  rescheduleReason,
  newDate,
  newTime,
  previousDate = null,
  previousTime = null,
  onActionComplete,
  variant = "row",
}: ReschedulePendingActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await api.put(API_ENDPOINTS.APPROVE_RESCHEDULE(bookingId), {});
      toast.success("Reschedule approved successfully");
      // Invalidate ALL booking and notification queries
      invalidateAfterBookingAction(queryClient);
      onActionComplete?.();
    } catch (error: any) {
      console.error("Error approving reschedule:", error);
      toast.error(error.message || "Failed to approve reschedule");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsProcessing(true);
      await api.put(API_ENDPOINTS.DECLINE_RESCHEDULE(bookingId), {
        reason: "Provider declined the reschedule request",
      });
      toast.success("Reschedule declined. Original booking restored.");
      // Invalidate ALL booking and notification queries
      invalidateAfterBookingAction(queryClient);
      setShowDeclineDialog(false);
      onActionComplete?.();
    } catch (error: any) {
      console.error("Error declining reschedule:", error);
      toast.error(error.message || "Failed to decline reschedule");
    } finally {
      setIsProcessing(false);
    }
  };

  // Row variant - compact buttons inline
  if (variant === "row") {
    return (
      <>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Slot comparison badge (if previous info available) */}
          {(previousDate || previousTime) && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              {previousTime || previousDate || "Previous"} → {newTime}
            </Badge>
          )}

          {/* Reschedule reason badge */}
          {rescheduleReason && (
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 text-xs max-w-xs truncate"
              title={rescheduleReason}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {rescheduleReason}
            </Badge>
          )}

          {/* New time info (if no previous) */}
          {!(previousDate || previousTime) && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              {newDate}
              <Clock className="h-3 w-3 ml-2 mr-1" />
              {newTime}
            </Badge>
          )}

          {/* Action buttons */}
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isProcessing}
            className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                Approve
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDeclineDialog(true)}
            disabled={isProcessing}
            className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Decline
              </>
            )}
          </Button>
        </div>

        <AlertDialog
          open={showDeclineDialog}
          onOpenChange={setShowDeclineDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Reschedule Request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore the original booking time and automatically
                refund the 10% reschedule fee to the customer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDecline}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Decline & Refund
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Expanded variant - full width actions with slot comparison
  return (
    <>
      <div className="space-y-4">
        {/* Slot Comparison Card */}
        {/* <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-md border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <HistoryIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">
                Customer requested reschedule
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Review the details and approve or decline this request
              </p>
            </div>
          </div> */}

        {/* Slot Comparison */}
        {/* {(previousDate || previousTime) && (
            <div className="bg-white/60 dark:bg-gray-900/40 rounded-md p-3 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between gap-4">
                {/* Previous Slot */}
        {/* <div className="flex-1">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                    Previous
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-purple-900 dark:text-purple-100">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{previousDate || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-purple-900 dark:text-purple-100 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{previousTime || "N/A"}</span>
                  </div>
                </div>  */}

        {/* Arrow */}
        {/* <ArrowRight className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-4" /> */}

        {/* New Slot */}
        {/* <div className="flex-1">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">
                    Requested
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-green-900 dark:text-green-100 font-semibold">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{newDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-green-900 dark:text-green-100 font-semibold mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{newTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div> */}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <Button
            size="default"
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve Reschedule
              </>
            )}
          </Button>

          <Button
            size="default"
            variant="outline"
            onClick={() => setShowDeclineDialog(true)}
            disabled={isProcessing}
            className="flex-1 sm:flex-none border-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Decline
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Reschedule Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the original booking time and automatically
              refund the 10% reschedule fee to the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Decline & Refund
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
