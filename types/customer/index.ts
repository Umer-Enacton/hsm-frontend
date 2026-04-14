/**
 * Customer Types
 * Type definitions for customer-related data structures
 */

import { type User } from "@/types/auth";

/**
 * Customer-specific user type
 */
export type CustomerUser = User & {
  roleId: 1; // Customer role
};

/**
 * Service interface (from customer perspective)
 */
export interface CustomerService {
  id: number;
  name: string;
  description: string;
  price: number;
  estimateDuration: number;
  image: string | null;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  provider?: {
    id: number;
    businessName: string;
    description?: string;
    email?: string;
    phone: string;
    state: string;
    city: string;
    logo: string | null;
    isVerified: boolean;
    rating?: number;
    totalReviews?: number;
  };
}

/**
 * Service details with extended information
 */
export interface ServiceDetails extends CustomerService {
  category?: {
    id: number;
    name: string;
  };
  slots: Slot[];
  reviews: Review[];
}

/**
 * Booking status enum
 */
export enum BookingStatus {
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  MISSED = "missed", // Booking time passed without completion
}

/**
 * Booking interface (customer view)
 * NOTE: Backend now includes nested service, provider, slot, and address data
 */
export interface CustomerBooking {
  id: number;
  customerId: number;
  businessProfileId: number;
  serviceId: number;
  slotId: number;
  addressId: number;
  status:
    | BookingStatus
    | "confirmed"
    | "completed"
    | "cancelled"
    | "missed";
  paymentStatus?: "pending" | "initiated" | "paid" | "failed" | "refunded";
  totalPrice: number;
  bookingDate: string;
  createdAt: string;
  // Provider earning tracking
  providerEarning?: number; // Final amount provider earns (in paise)
  platformFee?: number; // Platform commission amount (in paise)
  // Reschedule tracking fields
  rescheduleCount?: number;
  lastRescheduleFee?: number;
  rescheduleOutcome?: "accepted" | "rejected" | "cancelled" | null;
  previousSlotId?: number;
  previousSlotTime?: string; // "HH:mm:ss" format
  previousBookingDate?: string;
  rescheduleReason?: string;
  rescheduledBy?: "customer" | "provider";
  rescheduledAt?: string;
  // Refund tracking
  isRefunded?: boolean;
  refundAmount?: number; // Amount refunded to customer (in paise)
  // Provider payout tracking (15% when customer cancels confirmed booking)
  providerPayoutAmount?: number; // Amount paid to provider (in paise)
  providerPayoutStatus?: "pending" | "paid" | "failed";
  // Cancellation tracking
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: "customer" | "provider" | "system";
  // Completion verification (OTP-based)
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  completionNotes?: string | null;
  actualCompletionTime?: string | null;

  // These ARE included in backend response from updated getCustomerBookings endpoint
  service?: {
    id: number;
    name: string;
    description: string;
    price: number;
    duration?: number;
    imageUrl?: string | null;
    provider?: {
      id: number;
      businessName: string;
      email?: string;
      rating?: number;
      totalReviews?: number;
      isVerified?: boolean;
    };
  };

  slot?: {
    id: number;
    startTime: string;
    endTime?: string;
  };

  address?: {
    id: number;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  feedback?: {
    id: number;
    rating: number;
    comments?: string;
  };

  canCancel?: boolean;
  canReschedule?: boolean;
}

/**
 * Slot interface
 */
export interface Slot {
  id: number;
  startTime: string; // Format: "HH:mm:ss"
  businessProfileId: number;
  isAvailable?: boolean; // Whether slot is available for booking
  status?: "available" | "booked"; // Slot status
}

/**
 * Address interface
 */
export interface Address {
  id: number;
  userId: number;
  addressType: "home" | "work" | "billing" | "shipping" | "other";
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

/**
 * Review interface
 */
export interface Review {
  id: number;
  bookingId: number;
  rating: number;
  comments?: string;
  customerName: string;
  createdAt: string;
}

/**
 * Notification interface
 */
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
}

/**
 * Booking session for multi-step booking flow
 */
export interface BookingSession {
  serviceId: number;
  service: CustomerService;
  providerId: number;
  businessId: number;
  selectedDate: string;
  selectedSlot: Slot | null;
  selectedAddress: Address | null;
  estimatedPrice: number;
}

/**
 * Service filters
 */
export interface ServiceFilters {
  categoryId?: number;
  state?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
