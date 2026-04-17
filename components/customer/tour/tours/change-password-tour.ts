import type { DriveStep } from "driver.js";

export const changePasswordSteps: DriveStep[] = [
  {
    element: "[data-tour-security-tab]",
    popover: {
      title: "🔒 Security Tab",
      description:
        "Click the 'Security' tab to access password management.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-password-form]",
    popover: {
      title: "🔑 Change Your Password",
      description:
        "Enter your current password, then set a new one. Your new password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.",
      side: "right",
      align: "start",
    },
  },
];
