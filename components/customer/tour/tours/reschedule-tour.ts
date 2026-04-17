import type { DriveStep } from "driver.js";

export const rescheduleSteps: DriveStep[] = [
  {
    element: "[data-tour-confirmed-tab]",
    popover: {
      title: "✅ Switch to Confirmed",
      description:
        "Click the 'Confirmed' tab to see your upcoming bookings that can be rescheduled.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: "📖 Expand a Booking",
      description:
        "Click any row to expand it. You'll find the Reschedule button in the expanded details.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-reschedule-btn]",
    popover: {
      title: "🔄 Reschedule",
      description:
        "Click Reschedule to pick a new date and time slot. Your provider will be notified of the change.",
      side: "top",
      align: "start",
    },
  },
];
