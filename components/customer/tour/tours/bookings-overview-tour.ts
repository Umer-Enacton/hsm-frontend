import type { DriveStep } from "driver.js";

export const bookingsOverviewSteps: DriveStep[] = [
  {
    element: "[data-tour-booking-stats]",
    popover: {
      title: "📊 Booking Summary",
      description:
        "Your total, confirmed, completed, and cancelled booking counts — all at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-status-tabs]",
    popover: {
      title: "🗂️ Filter by Status",
      description:
        "Use these tabs to view all bookings or filter by Confirmed, Completed, Cancelled, or Delayed.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: "📋 Your Bookings Table",
      description:
        "Click any row (or the chevron arrow) to expand a booking and see full details, actions, and history.",
      side: "top",
      align: "start",
    },
  },
];
