import type { DriveStep } from "driver.js";

export const feedbackSteps: DriveStep[] = [
  {
    element: "[data-tour-completed-tab]",
    popover: {
      title: "✅ Switch to Completed",
      description:
        "Click the 'Completed' tab to see services you've already received.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: "📖 Expand a Completed Booking",
      description:
        "Click any completed booking row to expand it and see the review option.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-review-btn]",
    popover: {
      title: "⭐ Leave a Review",
      description:
        "Share your experience! Rate the service and leave a comment to help other customers.",
      side: "top",
      align: "start",
    },
  },
];
