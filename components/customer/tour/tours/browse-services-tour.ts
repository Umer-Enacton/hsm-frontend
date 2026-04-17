import type { DriveStep } from "driver.js";

export const browseServicesSteps: DriveStep[] = [
  {
    element: "[data-tour-search-bar]",
    popover: {
      title: "🔍 Search for Services",
      description:
        "Type a service name to quickly find what you need. Results update as you type.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-state-filter]",
    popover: {
      title: "📍 Filter by State",
      description: "Narrow down services to providers in your state.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour-category-filter]",
    popover: {
      title: "🏷️ Browse by Category",
      description:
        "Filter services by category — plumbing, cleaning, electrical, and more.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-services-grid]",
    popover: {
      title: "🃏 Service Cards",
      description:
        "Click any service card to view details, check available slots, and book. Each card shows ratings, location, and price.",
      side: "top",
      align: "start",
    },
  },
];
