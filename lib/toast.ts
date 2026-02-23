import { toast } from "sonner";

/**
 * Toast utility functions for consistent notifications across the app
 */

export const showSuccessToast = (message: string) => {
  return toast.success(message);
};

export const showErrorToast = (message: string) => {
  return toast.error(message);
};

export const showInfoToast = (message: string) => {
  return toast.info(message);
};

export const showWarningToast = (message: string) => {
  return toast.warning(message);
};

/**
 * API error handler that displays appropriate toast messages
 * @param error - Error object or message string
 * @param defaultMessage - Fallback message
 */
export const handleApiError = (
  error: unknown,
  defaultMessage = "An error occurred"
) => {
  let message = defaultMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    message = error.message;
  }

  toast.error(message);
  return message;
};

/**
 * API success handler
 * @param message - Success message to display
 */
export const handleApiSuccess = (message: string) => {
  toast.success(message);
};

/**
 * Loading toast that returns a promise toast
 * @param promise - The promise to track
 * @param messages - Object with loading, success, and error messages
 */
export const showPromiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages);
};
