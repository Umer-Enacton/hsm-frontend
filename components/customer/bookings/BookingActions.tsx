"use client";

import { CustomerBooking } from "@/types/customer";
import { CancelBookingButton } from "./CancelBookingButton";
import { ReviewButton } from "./ReviewButton";
import { RescheduleButton } from "./RescheduleButton";
import { RebookButton } from "./RebookButton";
import { DownloadInvoiceButton } from "./DownloadInvoiceButton";

interface BookingActionsProps {
  booking: CustomerBooking;
  businessId: number;
  serviceName?: string;
  onActionComplete?: () => void;
  variant?: "expanded" | "dropdown";
  className?: string;
}

export function BookingActions({
  booking,
  businessId,
  serviceName,
  onActionComplete,
  variant = "expanded",
  className = "",
}: BookingActionsProps) {
  const { id, status, serviceId } = booking;

  if (variant === "dropdown") {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {/* View Details - Always Available */}
        <button
          onClick={() => onActionComplete?.()}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded"
        >
          👁 View Details
        </button>

        {/* Status-Specific Actions */}
        {status === "pending" && (
          <>
            <CancelBookingButton
              bookingId={id}
              onCancel={onActionComplete}
              variant="dropdown"
            />
          </>
        )}

        {status === "confirmed" && (
          <>
            <RescheduleButton
              bookingId={id}
              businessId={businessId}
              serviceId={serviceId}
              currentSlotId={booking.slotId}
              currentBookingDate={booking.bookingDate}
              onRescheduled={onActionComplete}
              variant="dropdown"
            />
            <CancelBookingButton
              bookingId={id}
              onCancel={onActionComplete}
              variant="dropdown"
            />
          </>
        )}

        {status === "completed" && (
          <>
            <ReviewButton
              serviceId={serviceId}
              bookingId={id}
              serviceName={serviceName}
              onReviewSubmitted={onActionComplete}
              variant="dropdown"
            />
          </>
        )}

        {status === "cancelled" && (
          <RebookButton
            serviceId={serviceId}
            variant="dropdown"
          />
        )}

        {/* Common Actions */}
        <RebookButton serviceId={serviceId} variant="dropdown" />
        <DownloadInvoiceButton bookingId={id} variant="dropdown" />
      </div>
    );
  }

  // Expanded row variant - shows buttons inline
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* PENDING: Cancel + Invoice */}
      {status === "pending" && (
        <>
          <CancelBookingButton
            bookingId={id}
            onCancel={onActionComplete}
          />
          <DownloadInvoiceButton bookingId={id} />
        </>
      )}

      {/* CONFIRMED: Reschedule + Cancel + Invoice */}
      {status === "confirmed" && (
        <>
          <RescheduleButton
            bookingId={id}
            businessId={businessId}
            serviceId={serviceId}
            currentSlotId={booking.slotId}
            currentBookingDate={booking.bookingDate}
            onRescheduled={onActionComplete}
          />
          <CancelBookingButton
            bookingId={id}
            onCancel={onActionComplete}
          />
          <DownloadInvoiceButton bookingId={id} />
        </>
      )}

      {/* COMPLETED: Review + Invoice + Rebook */}
      {status === "completed" && (
        <>
          <ReviewButton
            serviceId={serviceId}
            bookingId={id}
            serviceName={serviceName}
            onReviewSubmitted={onActionComplete}
          />
          <DownloadInvoiceButton bookingId={id} />
          <RebookButton serviceId={serviceId} />
        </>
      )}

      {/* CANCELLED: Rebook only */}
      {status === "cancelled" && (
        <>
          <RebookButton serviceId={serviceId} />
          <DownloadInvoiceButton bookingId={id} />
        </>
      )}

      {/* Default fallback */}
      {!["pending", "confirmed", "completed", "cancelled"].includes(
        status
      ) && (
        <>
          <DownloadInvoiceButton bookingId={id} />
          <RebookButton serviceId={serviceId} />
        </>
      )}
    </div>
  );
}
