import type { DriveStep } from "driver.js";

export const dashboardSteps: DriveStep[] = [
  {
    // No element → driver.js renders a centred overlay popover automatically
    popover: {
      title: "🏠 Welcome to Your Dashboard!",
      description:
        "This is your home base. Let's take a quick tour of everything you can do here.",
      align: "center",
    },
  },
  {
    element: "[data-tour-stats-grid]",
    popover: {
      title: "📊 Booking Statistics",
      description:
        "At a glance: your total bookings, cancelled, completed, and upcoming services — all in one place.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-service-activity]",
    popover: {
      title: "📈 Service Activity Chart",
      description:
        "A visual breakdown of your booking history — see your upcoming, completed, and cancelled bookings in a chart.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-recent-bookings]",
    popover: {
      title: "🗓️ Recent Bookings",
      description:
        "Your latest bookings appear here for quick access. Click 'View All' to manage all bookings.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-featured-services]",
    popover: {
      title: "⭐ Featured Services",
      description:
        "Popular services from verified providers. Click any card to view details and book.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-theme-toggle]",
    popover: {
      title: "🌙 Dark / Light Mode",
      description:
        "Toggle between dark and light mode to suit your preference.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour-nav-browse]",
    popover: {
      title: "🔍 Browse Services",
      description:
        "Tap here to explore all available home services from verified providers.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-nav-bookings]",
    popover: {
      title: "📋 My Bookings",
      description:
        "Tap here to manage all your bookings — view details, reschedule, cancel, or download invoices.",
      side: "bottom",
      align: "center",
    },
  },
];
