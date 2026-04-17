import type { ExtendedDriveStep } from "../TourRunner";

// ---------------------------------------------------------------------------
// Common steps (shown on both mobile and desktop)
// ---------------------------------------------------------------------------

const commonSteps: ExtendedDriveStep[] = [
  {
    // No element → driver.js renders a centred overlay popover
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
];

// ---------------------------------------------------------------------------
// Desktop-only nav steps (visible in the top nav bar on md+ screens)
// ---------------------------------------------------------------------------

const desktopNavSteps: ExtendedDriveStep[] = [
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

// ---------------------------------------------------------------------------
// Mobile-only nav steps (nav lives inside a slide-in sidebar)
// ---------------------------------------------------------------------------

const mobileNavSteps: ExtendedDriveStep[] = [
  {
    // ── Intermediate step: user must tap the hamburger to open the sidebar ──
    // We hide the "Next" button so the only way to proceed is to actually tap
    // the menu icon.  TourRunner's onHighlighted hook detects __clickToAdvance
    // and wires a one-time click listener that calls driver.moveNext() after
    // the sidebar's 300 ms open animation finishes.
    element: "[data-tour-mobile-menu-btn]",
    __clickToAdvance: true,
    popover: {
      title: "☰ Open the Navigation Menu",
      description:
        "Your Browse Services and My Bookings links are inside the sidebar. Tap the menu icon above to open it and continue the tour.",
      side: "bottom",
      align: "start",
      // No "Next" button — the user MUST tap the element to proceed
      showButtons: ["close"],
    },
  },
  {
    element: "[data-tour-mobile-nav-browse]",
    popover: {
      title: "🔍 Browse Services",
      description:
        "Tap here to explore all available home services from verified providers.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-mobile-nav-bookings]",
    popover: {
      title: "📋 My Bookings",
      description:
        "Tap here to manage all your bookings — view details, reschedule, cancel, or download invoices.",
      side: "right",
      align: "center",
    },
  },
];

// ---------------------------------------------------------------------------
// getDashboardSteps — called at tour-start time so viewport detection is fresh
// ---------------------------------------------------------------------------

/**
 * Returns the full ordered list of dashboard tour steps, adapted for the
 * current viewport:
 *
 * - **Desktop** (≥ 768 px / Tailwind `md`): nav links are visible in the top
 *   bar, so the last two steps target them directly.
 *
 * - **Mobile** (< 768 px): nav links are hidden behind a hamburger sidebar, so
 *   an intermediate "open the menu" step is inserted first.  That step has
 *   `__clickToAdvance: true` and `showButtons: ["close"]` — the user must tap
 *   the hamburger icon to proceed, at which point TourRunner auto-advances once
 *   the sidebar animation completes.
 */
export function getDashboardSteps(): ExtendedDriveStep[] {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return isMobile
    ? [...commonSteps, ...mobileNavSteps]
    : [...commonSteps, ...desktopNavSteps];
}
