import type { DriveStep } from "driver.js";

export const invoiceSteps: DriveStep[] = [
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: "📋 Select a Booking",
      description:
        "Click any booking row to expand it. Invoice options appear in the action buttons below.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-view-invoice-btn]",
    popover: {
      title: "🧾 View Invoice",
      description:
        "Preview your invoice in a modal with full booking details and payment breakdown.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-download-invoice-btn]",
    popover: {
      title: "⬇️ Download Invoice",
      description:
        "Download your invoice as a PDF for your records or reimbursement purposes.",
      side: "top",
      align: "start",
    },
  },
];
