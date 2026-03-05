"use client";

/**
 * Payment Modal Component (Simplified)
 * Handles payment flow for booking services
 * UPDATED: Receives pre-created order data from parent
 * Parent checks availability BEFORE opening this modal
 */

import { useState, useEffect, useRef } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import type { PaymentOrderResponse, RazorpayOptions } from "@/types/payment";
import { RazorpayCheckoutButton } from "./RazorpayCheckout";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  orderData: PaymentOrderResponse; // Required: order data from parent
  serviceName?: string;
  servicePrice?: number;
  bookingDate?: string;
  slotTime?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type PaymentStep =
  | "ready" // Payment ready (order already created)
  | "processing" // Payment verification in progress
  | "success" // Payment successful
  | "failed" // Payment failed
  | "expired"; // Payment session expired

export function PaymentModal({
  orderData,
  serviceName = "Service",
  servicePrice = 0,
  bookingDate,
  slotTime,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("ready"); // Start at "ready" since order already created
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(60); // 1 minute in seconds

  // Track if payment flow has been handled (prevents duplicate redirects)
  const flowHandledRef = useRef(false);

  // Initialize timer when modal opens with orderData
  useEffect(() => {
    if (!orderData) return;

    // Calculate initial time remaining
    const expiresAt = new Date(orderData.expiresAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    setTimeRemaining(remaining);

    console.log(`⏰ Payment modal opened with ${remaining}s remaining`);
  }, [orderData]);

  // Countdown timer for slot lock expiry
  useEffect(() => {
    if (step !== "ready" || !orderData) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, orderData]);

  // NOTE: Removed automatic cleanup on unmount
  // The payment intent should only be cancelled when:
  // 1. User explicitly clicks Cancel button
  // 2. Payment completes successfully
  // 3. Payment fails
  // NOT on component unmount/remount (which can happen during re-renders)
  // The intent will expire naturally after 1 minute if not used

  const handlePaymentSuccess = async (response: any) => {
    // Prevent duplicate handling
    if (flowHandledRef.current) {
      console.log("⚠️ Payment flow already handled, skipping");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      // Razorpay v2 checkout structure
      const razorpayPaymentId =
        response.payload?.payment?.id ||
        response.payload?.payment?.razorpay_payment_id;

      const razorpayOrderId = orderData.razorpayOrderId;

      const razorpaySignature =
        response.payload?.payment?.razorpay_signature ||
        response.razorpay_signature ||
        "";

      console.log("🔑 Payment details extracted:", {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        hasSignature: !!razorpaySignature,
        event_name: response.event_name,
      });

      if (!razorpayOrderId) {
        throw new Error("Missing Razorpay order ID");
      }

      if (!razorpayPaymentId) {
        throw new Error("Missing Razorpay payment ID from response");
      }

      console.log("📤 Sending verification request...");

      await api.post(API_ENDPOINTS.PAYMENT.VERIFY, {
        razorpayOrderId,
        razorpayPaymentId,
        signature: razorpaySignature,
        paymentIntentId: orderData.paymentIntentId,
      });

      console.log("✅ Payment verified successfully");

      // Mark as handled to prevent duplicates
      flowHandledRef.current = true;

      // Show processing state, then success
      setTimeout(() => {
        console.log("✅ Showing success state");
        setStep("success");

        // Show toast immediately
        setTimeout(() => {
          console.log("🎉 Showing success toast");
          toast.success(
            "Payment successful! Your booking is pending confirmation from the service provider.",
          );
        }, 300);

        // Close modal after 2 seconds - let parent handle redirect
        setTimeout(() => {
          console.log("📞 Calling onSuccess() to close modal");
          onSuccess?.(); // Parent will redirect
        }, 2000);
      }, 1000); // 1 second processing time
    } catch (err: any) {
      console.error("❌ Error verifying payment:", err);
      setError(err.message || "Payment verification failed");
      setStep("failed");
      toast.error(err.message || "Payment verification failed");
    }
  };

  const handlePaymentFailure = async (error: any) => {
    console.log("❌ Razorpay payment.failed event:", error);

    // Record failed payment
    try {
      // Extract error details from new format if available
      let errorCode, errorDescription;

      if (error.payload && error.payload.error) {
        // New format
        errorCode = error.payload.error.code;
        errorDescription = error.payload.error.description;
      } else if (error.error) {
        // Old format
        errorCode = error.error.code;
        errorDescription =
          error.error.description || error.error.metadata?.reason;
      } else {
        // Fallback
        errorDescription =
          error.description || error.reason || "Payment failed";
      }

      await api.post(API_ENDPOINTS.PAYMENT.FAILED, {
        paymentIntentId: orderData.paymentIntentId,
        errorCode,
        errorDescription,
      });

      setError(errorDescription || "Payment failed");
    } catch (recordError) {
      console.error("Error recording failed payment:", recordError);
      setError("Payment failed. Please try again.");
    }

    setStep("failed");
    toast.error(error.description || error.reason || "Payment failed");
  };

  // Get Razorpay checkout options
  const getRazorpayOptions = (): RazorpayOptions | null => {
    if (!orderData) return null;

    return {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Home Service Management",
      description: `Payment for ${serviceName}`,
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      notes: {
        payment_intent_id: orderData.paymentIntentId.toString(),
        service_name: serviceName,
      },
      theme: {
        color: "#000000",
      },
      modal: {
        ondismiss: () => {
          // User closed without paying - do nothing
        },
        escape: true,
        backdropclose: false,
      },
    };
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render success state
  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-green-700">
            Payment Successful!
          </h3>
          <p className="text-muted-foreground mb-4">
            Your booking has been created and is pending confirmation.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to booking details...
          </p>
        </div>
      </div>
    );
  }

  // Render expired state
  if (step === "expired") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <Clock className="h-16 w-16 text-slate-950 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-slate-700">
            Session Expired
          </h3>
          <p className="text-muted-foreground mb-6">
            Your payment session has expired. The slot has been released for
            other customers.
          </p>
          <button
            onClick={onCancel}
            className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render failed state
  if (step === "failed") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            Payment Failed
          </h3>
          {error && <p className="text-muted-foreground mb-6">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Reset and allow parent to retry
                onCancel?.();
              }}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render processing state
  if (step === "processing") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Confirming Payment</h3>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  // Render payment ready state (main UI)
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Complete Payment</h2>
              <p className="text-xs text-muted-foreground">
                Secure payment via Razorpay
              </p>
            </div>
          </div>
          {step === "ready" && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                timeRemaining < 20
                  ? "bg-red-100 text-red-700 animate-pulse"
                  : timeRemaining < 40
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Warning about time limit */}
        {step === "ready" && timeRemaining < 30 && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              {timeRemaining < 15
                ? "Hurry! Your session is about to expire."
                : "Your session will expire soon. Complete payment to keep your slot."}
            </p>
          </div>
        )}

        {/* Payment Info */}
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <p>• Slot is reserved for 1 minute</p>
          <p>• Booking confirmed only after provider approval</p>
          <p>• Full refund if provider rejects booking</p>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Service</span>
            <span className="font-medium text-sm">{serviceName}</span>
          </div>
          {bookingDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="font-medium text-sm">
                {new Date(bookingDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {slotTime && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Time</span>
              <span className="font-medium text-sm">{slotTime}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-purple-600">
                ₹{orderData ? formatAmount(orderData.amount) : servicePrice}
              </span>
            </div>
          </div>
        </div>

        {/* Pay Now Button */}
        {step === "ready" && orderData && (
          <RazorpayCheckoutButton
            options={getRazorpayOptions()!}
            paymentIntentId={orderData.paymentIntentId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onModalClose={() => {
              // User closed Razorpay without paying
              console.log("ℹ️ Razorpay modal closed by user");
            }}
            className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 transition font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Pay ₹{formatAmount(orderData.amount)}
          </RazorpayCheckoutButton>
        )}

        {/* Cancel Button */}
        <button
          onClick={() => {
            // Cancel payment intent to release slot lock
            if (orderData && step === "ready") {
              console.log(
                "🔓 User cancelled - releasing slot lock for payment intent:",
                orderData.paymentIntentId,
              );
              api
                .post(API_ENDPOINTS.PAYMENT.CANCEL_INTENT, {
                  paymentIntentId: orderData.paymentIntentId,
                })
                .catch((err) => {
                  console.warn("⚠️ Failed to cancel payment intent:", err);
                });
            }
            onCancel?.();
          }}
          className="w-full mt-3 text-gray-600 hover:text-gray-800 transition font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
