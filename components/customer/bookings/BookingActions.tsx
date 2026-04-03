"use client";

import { CustomerBooking } from "@/types/customer";
import { CancelBookingButton } from "./CancelBookingButton";
import { ReviewButton } from "./ReviewButton";
import { RescheduleButton } from "./RescheduleButton";
import { RebookButton } from "./RebookButton";
import { DownloadInvoiceButton } from "./DownloadInvoiceButton";
import { ViewInvoiceButton } from "./ViewInvoiceButton";

interface BookingActionsProps {
  booking: CustomerBooking;
  businessId: number;
  serviceName?: string;
  onActionComplete?: () => void;
  variant?: "expanded" | "dropdown";
  className?: string;
  hasReviewed?: boolean;
}

export function BookingActions({
  booking,
  businessId,
  serviceName,
  onActionComplete,
  variant = "expanded",
  className = "",
  hasReviewed = false,
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



        {status === "confirmed" && (
          <>
            <RescheduleButton
              bookingId={id}
              businessId={businessId}
              serviceId={serviceId}
              servicePrice={booking.service?.price || 0}
              serviceName={booking.service?.name || serviceName || "Service"}
              currentSlotId={booking.slotId}
              currentBookingDate={booking.bookingDate}
              rescheduleCount={booking.rescheduleCount || 0}
              onRescheduled={onActionComplete}
              variant="dropdown"
            />
            <CancelBookingButton
              bookingId={id}
              status={status}
              totalPrice={booking.service?.price || 0}
              bookingDate={booking.bookingDate}
              bookingTime={booking.slot?.startTime || (booking as { startTime?: string }).startTime}
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
              existingReview={hasReviewed}
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
        <ViewInvoiceButton bookingId={id} variant="dropdown" />
        <DownloadInvoiceButton bookingId={id} variant="dropdown" />
      </div>
    );
  }

  // Expanded row variant - shows buttons inline
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>

      {/* CONFIRMED: Reschedule + Cancel + View Invoice + Download Invoice */}
      {status === "confirmed" && (
        <>
          <RescheduleButton
            bookingId={id}
            businessId={businessId}
            serviceId={serviceId}
            servicePrice={booking.service?.price || 0}
            serviceName={booking.service?.name || serviceName || "Service"}
            currentSlotId={booking.slotId}
            currentBookingDate={booking.bookingDate}
            rescheduleCount={booking.rescheduleCount || 0}
            onRescheduled={onActionComplete}
          />
          <CancelBookingButton
            bookingId={id}
            status={status}
            totalPrice={booking.service?.price || 0}
            bookingDate={booking.bookingDate}
            bookingTime={booking.slot?.startTime || (booking as any).startTime}
            onCancel={onActionComplete}
          />
          <ViewInvoiceButton bookingId={id} />
          <DownloadInvoiceButton bookingId={id} />
        </>
      )}



      {/* COMPLETED: Review + View Invoice + Download Invoice + Rebook */}
      {status === "completed" && (
        <>
          <ReviewButton
            serviceId={serviceId}
            bookingId={id}
            serviceName={serviceName}
            onReviewSubmitted={onActionComplete}
            existingReview={hasReviewed}
          />
          <ViewInvoiceButton bookingId={id} />
          <DownloadInvoiceButton bookingId={id} />
          <RebookButton serviceId={serviceId} />
        </>
      )}

      {/* CANCELLED: Rebook + View Invoice + Download Invoice */}
      {status === "cancelled" && (
        <>
          <RebookButton serviceId={serviceId} />
          <ViewInvoiceButton bookingId={id} />
          <DownloadInvoiceButton bookingId={id} />
        </>
      )}



      {/* Default fallback */}
      {!["confirmed", "completed", "cancelled"].includes(
        status
      ) && (
        <>
          <ViewInvoiceButton bookingId={id} />
          <DownloadInvoiceButton bookingId={id} />
          <RebookButton serviceId={serviceId} />
        </>
      )}
    </div>
  );
}
