/**
 * Provider Types
 * Type definitions for provider-related data structures
 */

/**
 * Business profile status
 */
export enum BusinessStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  INACTIVE = "inactive",
}

/**
 * Business profile interface
 * Note: Business and Provider are separate entities
 * - Business has its own phone (business contact number)
 * - Provider (user) has their own phone/email (personal contact)
 */
export interface Business {
  id: number;
  userId: number; // Provider ID (same as providerId)
  providerId: number; // Owner of the business
  name: string; // Business name
  businessName?: string; // Business name (backend field)
  description?: string;
  category?: string;
  categoryId?: number;
  logo?: string | null;
  coverImage?: string | null;
  phone?: string; // Business phone (can be different from provider's phone)
  state?: string; // State/UT where business is located
  city?: string; // City where business is located
  email?: string; // Provider's email (for contact purposes)
  website?: string;
  status: BusinessStatus;
  isVerified: boolean;
  rating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
  // Provider info (for reference)
  providerName?: string; // Provider's personal name
  providerEmail?: string; // Provider's personal email
  providerPhone?: string; // Provider's personal phone
}

/**
 * Simplified working hours - applies to all days
 */
export interface WorkingHours {
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

/**
 * Simplified break time - applies to all days (optional)
 */
export interface BreakTime {
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

/**
 * Availability slot interface (for onboarding)
 * Used for generating date-specific slots during onboarding
 * Converted to unique start times in backend
 */
export interface AvailabilitySlot {
  id?: number;
  businessId: number;
  date: string; // Format: "YYYY-MM-DD"
  startTime: string; // Format: "HH:mm" - only start time now
  endTime?: string; // Format: "HH:mm" - optional, for display only
  isBooked: boolean;
  bookingId?: number;
}

/**
 * Slot interface (backend stored slots)
 * Backend stores only start times (recurring daily)
 */
export interface Slot {
  id: number;
  businessId: number;
  startTime: string; // Format: "HH:mm:ss" - only start time
  createdAt?: string;
}

/**
 * Slot generation mode
 */
export enum SlotMode {
  MANUAL = "manual",
  AUTO = "auto",
}

/**
 * Onboarding data - simplified 3-stage flow
 */
export interface OnboardingData {
  // Stage 1: Business Details
  businessDetails: {
    name: string;
    description: string;
    categoryId: number;
    category?: string; // Display name only
    logo?: File | null;
    coverImage?: File | null;
    businessPhone?: string;
    state?: string; // State/UT
    city?: string; // City within state
    website?: string;
  };

  // Stage 2: Working Hours Configuration
  workingHours: WorkingHours;
  breakTime?: BreakTime; // Optional

  // Stage 3: Slot Generation Settings
  slotInterval: number; // in minutes (15, 30, 60, etc.)
}

/**
 * Onboarding stage - simplified to 3 stages
 */
export enum OnboardingStage {
  BUSINESS_DETAILS = 1,
  WORKING_HOURS = 2,
  SLOT_GENERATION = 3,
}

/**
 * Service interface
 */
export interface Service {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  price: number;
  duration?: number; // in minutes (optional for safety)
  EstimateDuration?: number; // Backend field name (for compatibility)
  image?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Provider booking interface
 */
export interface ProviderBooking {
  id: number;
  businessId: number;
  serviceId: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  status: BookingStatus;
  price: number;
  createdAt?: string;
}

/**
 * Booking status
 */
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

/**
 * Review interface
 */
export interface Review {
  id: number;
  businessId: number;
  serviceId?: number;
  customerId: number;
  customerName: string;
  bookingId: number;
  rating: number;
  comment?: string;
  createdAt?: string;
}

/**
 * Dashboard stats interface
 */
export interface ProviderDashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  activeServices: number;
}
