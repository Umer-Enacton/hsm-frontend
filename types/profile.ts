/**
 * Profile Types
 * Type definitions for user profile management
 */

/**
 * Profile update form data
 */
export interface ProfileUpdateData {
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
}

/**
 * Password change data
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Profile form errors
 */
export interface ProfileFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Password form errors
 */
export interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * Profile statistics (role-specific)
 */
export interface ProfileStats {
  totalBookings?: number;
  completedServices?: number;
  totalReviews?: number;
  totalServices?: number;
  activeBookings?: number;
  averageRating?: number;
  totalUsers?: number;
  totalCategories?: number;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  type: "login" | "update" | "booking" | "service";
}

/**
 * Backend upload response (from /api/upload/* endpoints)
 */
export interface BackendUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    publicId: string;
    width: number;
    height: number;
  };
}
