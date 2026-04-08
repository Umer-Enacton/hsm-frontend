"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  subscriptionId: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface AuthorizeResponse {
  key: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerContact: string;
}

/**
 * SubscriptionCheckoutModal
 *
 * Opens Razorpay checkout.js modal for subscription authorization.
 * Handles:
 * 1. Loading Razorpay checkout script dynamically
 * 2. Fetching subscription details from backend
 * 3. Opening checkout with subscription_id (critical for subscriptions)
 * 4. Cleaning up pending subscriptions when modal is closed
 * 5. Handling payment success/failure
 */
export function SubscriptionCheckoutModal({
  isOpen,
  subscriptionId,
  onSuccess,
  onClose,
}: SubscriptionCheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const isProcessingRef = useRef(false);
  const cleanupScheduledRef = useRef(false);

  // Load Razorpay checkout.js dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else if (window.Razorpay) {
      setScriptLoaded(true);
    }
  }, []);

  // Open checkout when modal opens and subscriptionId is available
  useEffect(() => {
    if (isOpen && subscriptionId && scriptLoaded && !isProcessingRef.current) {
      openCheckout();
    }
  }, [isOpen, subscriptionId, scriptLoaded]);

  // Cancel pending subscription when component unmounts or modal closes
  useEffect(() => {
    return () => {
      // Cleanup: cancel pending subscription if modal closed without payment
      if (subscriptionId && cleanupScheduledRef.current && !isProcessingRef.current) {
        cancelPendingSubscription();
      }
    };
  }, [subscriptionId]);

  const cancelPendingSubscription = async () => {
    if (!subscriptionId) return;

    try {
      console.log("🗑️ Cancelling pending subscription:", subscriptionId);
      await api.post(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CANCEL_PENDING, {
        subscriptionId,
      });
      console.log("✅ Pending subscription cancelled");
    } catch (error: any) {
      console.error("Error cancelling pending subscription:", error);
      // Don't show toast for cleanup errors - user already closed modal
    }
  };

  const openCheckout = async () => {
    if (!subscriptionId || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsLoading(true);
    cleanupScheduledRef.current = true; // Schedule cleanup in case modal is closed

    try {
      // Step 1: Fetch subscription details from backend
      console.log("🔐 Fetching subscription details for:", subscriptionId);
      const response = await api.post<{ message: string; data: AuthorizeResponse }>(
        API_ENDPOINTS.PROVIDER_SUBSCRIPTION_AUTHORIZE,
        { subscriptionId }
      );

      if (!response.data) {
        throw new Error("Failed to fetch subscription details");
      }

      const details = response.data;
      console.log("✅ Subscription details fetched:", details);

      // Step 2: Open Razorpay checkout with subscription_id
      const options = {
        key: details.key,
        subscription_id: details.subscriptionId, // CRITICAL: Use subscription_id for subscriptions
        amount: details.amount,
        currency: details.currency,
        name: "Home Service Management",
        description: details.description,
        prefill: {
          name: details.customerName,
          email: details.customerEmail,
          contact: details.customerContact,
        },
        theme: {
          color: "#6366f1",
        },
        // Modal handlers
        modal: {
          ondismiss: async () => {
            console.log("❌ Checkout modal dismissed by user");
            isProcessingRef.current = false;
            cleanupScheduledRef.current = true;

            // Cancel pending subscription
            await cancelPendingSubscription();

            // Notify user
            toast.info("Payment cancelled. Subscription not created.");

            // Close modal
            handleClose();
          },
          escape: true,
          backdropclose: true,
        },
        // Payment handler - this is called after successful payment
        handler: function (response: any) {
          console.log("✅ Payment successful:", response);

          // Mark as processed so cleanup doesn't run
          isProcessingRef.current = false;
          cleanupScheduledRef.current = false;

          // Show success message
          toast.success("Subscription activated successfully!");

          // Close modal
          handleClose();

          // Refresh data
          if (onSuccess) {
            onSuccess();
          }
        },
      };

      console.log("🚀 Opening Razorpay checkout with options:", options);
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      // Handle payment errors
      razorpay.on("payment.failed", function (response: any) {
        console.error("❌ Payment failed:", response);
        isProcessingRef.current = false;

        const errorDescription = response.error?.description || "Payment failed. Please try again.";
        toast.error(errorDescription);

        // Cancel pending subscription on failure
        cancelPendingSubscription();
        handleClose();
      });

    } catch (error: any) {
      console.error("Error opening checkout:", error);
      toast.error(error?.message || "Failed to open payment. Please try again.");
      isProcessingRef.current = false;

      // Cancel pending subscription on error
      await cancelPendingSubscription();
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    isProcessingRef.current = false;
    cleanupScheduledRef.current = false;
    if (onClose) {
      onClose();
    }
  };

  // Don't render anything if not open - checkout is handled in a modal by Razorpay
  if (!isOpen) return null;

  // Show loading state while checkout is being prepared
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-center text-gray-700">
          {isLoading ? "Opening payment..." : "Preparing checkout..."}
        </p>
        <button
          onClick={handleClose}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
