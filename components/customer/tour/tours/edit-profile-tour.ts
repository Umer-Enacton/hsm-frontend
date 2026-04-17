import type { DriveStep } from "driver.js";

export const editProfileSteps: DriveStep[] = [
  {
    element: "[data-tour-overview-tab]",
    popover: {
      title: "👤 Profile Overview Tab",
      description:
        "This tab shows your personal account information — name, email, phone, and role.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-profile-info]",
    popover: {
      title: "📋 Your Account Details",
      description: "Your current name, email, phone, and role are shown here.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-edit-profile-btn]",
    popover: {
      title: "✏️ Edit Your Profile",
      description:
        "Click this button to open the edit modal where you can update your name, phone number, and profile photo.",
      side: "top",
      align: "center",
    },
  },
];
