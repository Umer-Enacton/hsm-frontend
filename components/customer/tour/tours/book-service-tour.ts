import type { DriveStep } from "driver.js";

export const bookServiceSteps: DriveStep[] = [
  {
    element: "[data-tour-date-picker]",
    popover: {
      title: "📅 Pick Your Date",
      description:
        "Select your preferred date for the service. Dates in the past and fully-booked dates are disabled.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "[data-tour-slots-section]",
    popover: {
      title: "⏰ Choose a Time Slot",
      description:
        "Available slots are shown in green. Booked slots are greyed out. Select your preferred time.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour-address-selector]",
    popover: {
      title: "📍 Select Your Address",
      description:
        "Pick one of your saved addresses for the service visit. Add a new address from your Profile if needed.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour-book-now]",
    popover: {
      title: "✅ Book Now!",
      description:
        "Once you've selected a date, slot, and address — tap Book Now to confirm and proceed to payment.",
      side: "left",
      align: "end",
    },
  },
];
