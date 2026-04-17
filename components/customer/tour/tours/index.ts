import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  CalendarPlus,
  CalendarDays,
  CalendarClock,
  CalendarX,
  FileText,
  UserCog,
  Star,
  Lock,
} from "lucide-react";

import { dashboardSteps } from "./dashboard-tour";
import { browseServicesSteps } from "./browse-services-tour";
import { bookServiceSteps } from "./book-service-tour";
import { bookingsOverviewSteps } from "./bookings-overview-tour";
import { rescheduleSteps } from "./reschedule-tour";
import { cancelSteps } from "./cancel-tour";
import { invoiceSteps } from "./invoice-tour";
import { editProfileSteps } from "./edit-profile-tour";
import { feedbackSteps } from "./feedback-tour";
import { changePasswordSteps } from "./change-password-tour";
import type { DriveStep } from "driver.js";

// ---------------------------------------------------------------------------
// TourDefinition type
// ---------------------------------------------------------------------------

export interface TourDefinition {
  id: string;
  title: string;
  description: string;
  /** Lucide icon component rendered in the help menu */
  icon: LucideIcon;
  /** Navigate to this path before starting the tour (when not already there) */
  targetPath: string;
  steps: DriveStep[];
  /** Only show this tour when the customer has at least one confirmed booking */
  requiresConfirmedBookings?: boolean;
  /** Only show this tour when the customer has at least one completed booking */
  requiresCompletedBookings?: boolean;
}

// ---------------------------------------------------------------------------
// Tour registry
// ---------------------------------------------------------------------------

export const ALL_TOURS: TourDefinition[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Learn about your dashboard stats and navigation",
    icon: LayoutDashboard,
    targetPath: "/customer",
    steps: dashboardSteps,
  },
  {
    id: "browse-services",
    title: "Browse Services",
    description: "Find services using search and filters",
    icon: Search,
    targetPath: "/customer/services",
    steps: browseServicesSteps,
  },
  {
    id: "book-service",
    title: "Book a Service",
    description: "Pick a date, time slot, and address to book",
    icon: CalendarPlus,
    // targetPath is the listing page; the actual tour runs on a detail page.
    // HelpButton handles this case specially (shows a guiding toast instead).
    targetPath: "/customer/services",
    steps: bookServiceSteps,
  },
  {
    id: "bookings-overview",
    title: "Bookings Overview",
    description: "Navigate your bookings and use status filters",
    icon: CalendarDays,
    targetPath: "/customer/bookings",
    steps: bookingsOverviewSteps,
  },
  {
    id: "reschedule",
    title: "How to Reschedule",
    description: "Change the date or time of a confirmed booking",
    icon: CalendarClock,
    targetPath: "/customer/bookings",
    steps: rescheduleSteps,
    requiresConfirmedBookings: true,
  },
  {
    id: "cancel",
    title: "How to Cancel",
    description: "Cancel a confirmed booking and get a refund",
    icon: CalendarX,
    targetPath: "/customer/bookings",
    steps: cancelSteps,
    requiresConfirmedBookings: true,
  },
  {
    id: "invoice",
    title: "View & Download Invoice",
    description: "Preview or download your booking invoice as PDF",
    icon: FileText,
    targetPath: "/customer/bookings",
    steps: invoiceSteps,
  },
  {
    id: "feedback",
    title: "Leave a Review",
    description: "Rate a completed service and share your experience",
    icon: Star,
    targetPath: "/customer/bookings",
    steps: feedbackSteps,
    requiresCompletedBookings: true,
  },
  {
    id: "edit-profile",
    title: "Edit Your Profile",
    description: "Update your name, phone number, and profile photo",
    icon: UserCog,
    targetPath: "/customer/profile",
    steps: editProfileSteps,
  },
  {
    id: "change-password",
    title: "Change Password",
    description: "Update your account password securely",
    icon: Lock,
    targetPath: "/customer/profile",
    steps: changePasswordSteps,
  },
];

// ---------------------------------------------------------------------------
// Lookup map  (id → TourDefinition)
// ---------------------------------------------------------------------------

export const TOURS_BY_ID: Record<string, TourDefinition> = Object.fromEntries(
  ALL_TOURS.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Page-relevance helpers
// ---------------------------------------------------------------------------

/**
 * Maps each tour id to the pathname(s) where it is considered "on this page".
 * A trailing "/" means startsWith matching (dynamic route segments).
 */
const TOUR_PATHS: Record<string, string[]> = {
  dashboard: ["/customer"],
  "browse-services": ["/customer/services"],
  // book-service is only relevant when already on a specific service detail page
  "book-service": ["/customer/services/"],
  "bookings-overview": ["/customer/bookings"],
  reschedule: ["/customer/bookings"],
  cancel: ["/customer/bookings"],
  invoice: ["/customer/bookings"],
  feedback: ["/customer/bookings"],
  "edit-profile": ["/customer/profile"],
  "change-password": ["/customer/profile"],
};

/**
 * Returns true when the given tour is relevant as a "This Page" tour
 * for the supplied pathname.
 *
 * Special rule for `book-service`: only matches a service detail page
 * (i.e. /customer/services/<id>) — NOT the listing page itself.
 */
export function isRelevantForPage(tourId: string, pathname: string): boolean {
  if (tourId === "book-service") {
    return (
      pathname.startsWith("/customer/services/") &&
      pathname !== "/customer/services/"
    );
  }

  const paths = TOUR_PATHS[tourId] ?? [];
  return paths.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p,
  );
}

// ---------------------------------------------------------------------------
// Menu-data builder
// ---------------------------------------------------------------------------

export interface BookingData {
  hasConfirmedBookings: boolean;
  hasCompletedBookings: boolean;
}

/**
 * Splits all tours into "thisPage" (relevant to current route) and
 * "otherPages" (everything else), filtering out conditional tours that
 * can't run due to missing booking data.
 */
export function getToursByPage(
  pathname: string,
  bookingData?: BookingData,
): { thisPage: TourDefinition[]; otherPages: TourDefinition[] } {
  const thisPage: TourDefinition[] = [];
  const otherPages: TourDefinition[] = [];

  for (const tour of ALL_TOURS) {
    if (tour.requiresConfirmedBookings && !bookingData?.hasConfirmedBookings) {
      continue;
    }
    if (tour.requiresCompletedBookings && !bookingData?.hasCompletedBookings) {
      continue;
    }

    if (isRelevantForPage(tour.id, pathname)) {
      thisPage.push(tour);
    } else {
      otherPages.push(tour);
    }
  }

  return { thisPage, otherPages };
}
