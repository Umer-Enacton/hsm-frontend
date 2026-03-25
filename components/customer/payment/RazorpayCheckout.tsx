"use client";

/**
 * Razorpay Checkout Component
 * Integrates Razorpay payment gateway
 * UPDATED: Validates payment intent before opening checkout
 */

import { useEffect, useRef, useState } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Loader2 } from "lucide-react";
import type { RazorpayOptions, RazorpayResponse } from "@/types/payment";
import { cn } from "@/lib/utils";

interface RazorpayCheckoutProps {
  options: RazorpayOptions;
  paymentIntentId?: number; // Required for validation
  onPaymentSuccess?: (response: RazorpayResponse) => void;
  onPaymentFailure?: (error: any) => void;
  onModalClose?: () => void;
}

/**
 * Custom hook to load Razorpay script
 */
export function useRazorpayScript() {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    isLoaded.current = true;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      console.log("✅ Razorpay script loaded");
    };
    script.onerror = () => {
      console.error("❌ Failed to load Razorpay script");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return isLoaded.current;
}

/**
 * Hook to open Razorpay checkout
 * UPDATED: Validates payment intent before opening
 */
export function useRazorpay({
  options,
  paymentIntentId,
  onPaymentSuccess,
  onPaymentFailure,
  onModalClose,
}: RazorpayCheckoutProps) {
  const scriptLoaded = useRazorpayScript();
  const [isValidating, setIsValidating] = useState(false);

  const openCheckout = async () => {
    if (typeof window === "undefined" || !(window as any).Razorpay) {
      const error = new Error(
        "Razorpay not loaded. Please refresh and try again.",
      );
      console.error("❌ Razorpay not loaded");
      onPaymentFailure?.(error);
      return;
    }

    // CRITICAL: Validate payment intent before opening Razorpay
    if (paymentIntentId) {
      setIsValidating(true);
      try {
        console.log(
          `🔍 Validating payment intent ${paymentIntentId} before opening Razorpay...`,
        );

        const validationResponse = await api.post(
          API_ENDPOINTS.PAYMENT.VALIDATE_INTENT,
          {
            paymentIntentId,
          },
        );

        if (!validationResponse.valid) {
          console.error(
            `❌ Payment intent validation failed:`,
            validationResponse,
          );

          // Close the payment modal
          onModalClose?.();

          onPaymentFailure?.(new Error(validationResponse.message));
          setIsValidating(false);
          return;
        }

        console.log(
          `✅ Payment intent validated successfully (${validationResponse.data?.timeRemaining}s remaining)`,
        );
      } catch (error: any) {
        console.error(`❌ Error validating payment intent:`, error);

        // Close the payment modal
        onModalClose?.();

        onPaymentFailure?.(error);
        setIsValidating(false);
        return;
      } finally {
        setIsValidating(false);
      }
    }

    try {
      console.log("🚀 Opening Razorpay checkout with options:", options);

      // Create Razorpay instance WITHOUT handler in options
      // We'll use event listeners instead
      const { handler, ...razorpayOptions } = options;

      const rzp = new (window as any).Razorpay(razorpayOptions);

      // Set up event listeners
      rzp.on("payment.success", function (response: any) {
        console.log("✅ Razorpay payment.success event:", response);
        onPaymentSuccess?.(response);
      });

      rzp.on("payment.failed", function (error: any) {
        console.error("❌ Razorpay payment.failed event:", error);
        onPaymentFailure?.(error);
      });

      rzp.on("modal.close", function () {
        console.log("ℹ️ Razorpay modal.closed event");
        onModalClose?.();
      });

      // Open the checkout
      rzp.open();
    } catch (error) {
      console.error("❌ Error opening Razorpay checkout:", error);
      onPaymentFailure?.(error);
    }
  };

  return { openCheckout, scriptLoaded, isValidating };
}

/**
 * Razorpay Checkout Button Component
 * UPDATED: Accepts paymentIntentId for validation
 */
interface RazorpayCheckoutButtonProps {
  options: RazorpayOptions;
  paymentIntentId?: number; // Required for validation
  onPaymentSuccess?: (response: RazorpayResponse) => void;
  onPaymentFailure?: (error: any) => void;
  onModalClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function RazorpayCheckoutButton({
  options,
  paymentIntentId,
  onPaymentSuccess,
  onPaymentFailure,
  onModalClose,
  children,
  className = "",
  disabled = false,
  loading = false,
}: RazorpayCheckoutButtonProps) {
  const { openCheckout, scriptLoaded, isValidating } = useRazorpay({
    options,
    paymentIntentId,
    onPaymentSuccess,
    onPaymentFailure,
    onModalClose,
  });

  const handleClick = () => {
    if (!scriptLoaded) {
      onPaymentFailure?.(
        new Error("Payment gateway is loading. Please wait..."),
      );
      return;
    }
    openCheckout();
  };

  const isLoading = loading || isValidating;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading || !scriptLoaded}
      className={cn("", className)}
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {isValidating ? "Validating..." : "Processing..."}
        </div>
      ) : (
        children || "Pay Now"
      )}
    </button>
  );
}
