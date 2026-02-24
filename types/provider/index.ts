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
 */
export interface Business {
  id: number;
  userId: number;
  name: string;
  description?: string;
  category?: string;
  logo?: string | null;
  coverImage?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: BusinessStatus;
  isVerified: boolean;
  rating?: number;
  totalReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Day of week enum
 */
export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

/**
 * Working hours interface
 */
export interface WorkingHours {
  id?: number;
  businessId: number;
  day: DayOfWeek;
  isOpen: boolean;
  startTime?: string; // Format: "HH:mm"
  endTime?: string; // Format: "HH:mm"
}

/**
 * Break time interface
 */
export interface BreakTime {
  id?: number;
  businessId: number;
  day?: DayOfWeek; // If null, applies to all days
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
}

/**
 * Availability slot interface
 */
export interface AvailabilitySlot {
  id?: number;
  businessId: number;
  date: string; // Format: "YYYY-MM-DD"
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  isBooked: boolean;
  bookingId?: number;
}

/**
 * Slot generation mode
 */
export enum SlotMode {
  MANUAL = "manual",
  AUTO = "auto",
}

/**
 * Onboarding data - accumulates through stages
 */
export interface OnboardingData {
  // Stage 1: Business Profile
  businessProfile: {
    name: string;
    description: string;
    categoryId: number; // Changed from category to categoryId for backend
    category?: string; // Display name only
    logo?: File | null;
    coverImage?: File | null;
    phone?: string; // Pulled from user profile by backend
    email?: string; // Pulled from user profile by backend
    address?: string; // Not currently in backend schema
    website?: string;
  };

  // Stage 2: Working Hours
  workingHours: WorkingHours[];

  // Stage 3: Break Times (optional)
  breakTimes: BreakTime[];

  // Stage 4: Availability Slots
  availabilitySlots: {
    mode: SlotMode;
    slots: AvailabilitySlot[];
    autoGenerateConfig?: {
      startDate: string;
      endDate: string;
      slotDuration: number; // in minutes
      startTime: string;
      endTime: string;
      excludeDays: DayOfWeek[];
    };
  };
}

/**
 * Onboarding stage
 */
export enum OnboardingStage {
  BUSINESS_PROFILE = 1,
  WORKING_HOURS = 2,
  BREAK_TIMES = 3,
  AVAILABILITY = 4,
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
  duration: number; // in minutes
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
