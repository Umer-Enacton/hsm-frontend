import type { DriveStep } from "driver.js";

export const cancelSteps: DriveStep[] = [
  {
    element: "[data-tour-confirmed-tab]",
    popover: {
      title: "✅ Switch to Confirmed",
      description:
        "Click the 'Confirmed' tab to see your upcoming bookings.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: "📖 Expand a Booking",
      description:
        "Click any row to expand it and see all available actions including Cancel.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-cancel-btn]",
    popover: {
      title: "❌ Cancel Booking",
      description:
        "Click Cancel to cancel this booking. A refund will be processed according to the cancellation policy shown.",
      side: "top",
      align: "start",
    },
  },
];
