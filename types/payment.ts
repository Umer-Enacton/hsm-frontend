/**
 * Payment Types
 * Type definitions for payment-related data structures
 */

/**
 * Payment status enum
 */
export type PaymentStatus = "pending" | "initiated" | "paid" | "failed" | "refunded";

/**
 * Payment method enum
 */
export type PaymentMethod = "razorpay" | "upi" | "card" | "netbanking" | "wallet" | "emi";

/**
 * Payment interface
 */
export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // Amount in paise (₹500 = 50000 paise)
  currency: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
}

/**
 * Request to create payment order
 */
export interface PaymentOrderRequest {
  serviceId: number;
  slotId: number;
  addressId: number;
  bookingDate: string; // ISO date string
}

/**
 * Response from create payment order endpoint
 */
export interface PaymentOrderResponse {
  message: string;
  paymentIntentId: number;
  razorpayOrderId: string;
  amount: number; // Amount in paise
  currency: string;
  keyId: string; // Razorpay key ID
  expiresAt: string; // ISO timestamp
}

/**
 * Request to verify payment
 */
export interface PaymentVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
  paymentIntentId: number;
}

/**
 * Response from verify payment endpoint
 */
export interface PaymentVerifyResponse {
  message: string;
  paymentId: number;
  bookingId: number;
  booking?: {
    id: number;
    status: string;
    paymentStatus: string;
  };
}

/**
 * Razorpay checkout options
 */
export interface RazorpayOptions {
  key: string;
  amount: number; // Amount in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler?: (response: RazorpayResponse) => void; // Optional - we use event listeners instead
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  readonly?: {
    email?: boolean;
    contact?: boolean;
    name?: boolean;
  };
  send_sms_hash?: boolean;
  allow_rotation?: boolean;
}

/**
 * Razorpay v2 checkout response
 * New format wraps everything in an event object
 */

// Actual payment data structure
export interface RazorpayPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  // Old format properties (for backward compatibility)
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

// Event wrapper format (v2 checkout)
export interface RazorpayV2Response {
  event_name: string;
  timestamp: string;
  payload: {
    payment: RazorpayPaymentData;
    error?: {
      code: string;
      description: string;
      reason?: string;
      metadata?: any;
    };
  };
}

// Old direct format (for backward compatibility)
export interface RazorpayLegacyResponse extends RazorpayPaymentData {
  error?: {
    code: string;
    description: string;
    reason?: string;
    metadata?: any;
  };
}

// Union type for both formats
export type RazorpayResponse = RazorpayV2Response | RazorpayLegacyResponse;

/**
 * Refund request
 */
export interface RefundRequest {
  reason?: string;
}

/**
 * Refund response
 */
export interface RefundResponse {
  message: string;
  refundId: string;
  refundAmount: number; // Amount in rupees
  payment: Payment;
}

/**
 * Payment session for checkout flow
 */
export interface PaymentSession {
  orderId: string;
  amount: number;
  bookingId: number;
  bookingData?: {
    service: string;
    date: string;
    time: string;
    price: number;
  };
}

/**
 * Payment UI state
 */
export interface PaymentUIState {
  isLoading: boolean;
  isProcessing: boolean;
  error?: string;
  currentStep: "init" | "processing" | "success" | "failed";
}
