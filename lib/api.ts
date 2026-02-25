/**
 * API Configuration and Utilities
 * Centralized API configuration for the Home Service Management frontend
 */

// Base URL from environment or fallback to localhost:8000
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Log API_BASE_URL for debugging
if (typeof window !== 'undefined') {
  console.log("=== API CONFIG ===");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log("Window location:", window.location.href);
  console.log("================");
}

/**
 * API endpoints - all relative to BASE_URL
 * Note: API routes are mounted at root level (no /api prefix based on updated docs)
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_OTP: "/verify-otp",
  RESET_PASSWORD: "/reset-password",

  // User
  USER_PROFILE: "/user/profile",
  USERS: "/users",
  UPDATE_USER: "/users",

  // Business
  BUSINESSES: "/businesses",
  BUSINESS_BY_ID: (id: string | number) => `/businesses/${id}`,
  BUSINESS_BY_PROVIDER: (userId: string | number) =>
    `/business/provider/${userId}`,
  VERIFY_BUSINESS: (id: string | number) => `/businesses/verify/${id}`,
  UPDATE_BUSINESS: (id: string | number) => `/businesses/${id}`,
  DELETE_BUSINESS: (id: string | number) => `/businesses/${id}`,

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string | number) => `/categories/${id}`,

  // Services
  SERVICES: "/services",
  SERVICES_BY_BUSINESS: (businessId: string | number) =>
    `/services/business/${businessId}`,
  SERVICE_BY_ID: (serviceId: string | number) => `/services/${serviceId}`,

  // Slots
  SLOTS_PUBLIC: (businessId: string | number) =>
    `/slots/public/${businessId}`,
  SLOTS: (businessId: string | number) => `/slots/${businessId}`,
  DELETE_SLOT: (businessId: string | number, slotId: string | number) =>
    `/businesses/${businessId}/slots/${slotId}`,

  // Address
  ADDRESSES: "/address",
  ADDRESS_BY_ID: (addressId: string | number) => `/address/${addressId}`,

  // Bookings
  BOOKING: "/booking",
  BOOKING_BY_ID: (id: string | number) => `/booking/${id}`,
  CUSTOMER_BOOKINGS: "/bookings/customer",
  PROVIDER_BOOKINGS: "/bookings/provider",
  ADD_BOOKING: "/add-booking",
  ACCEPT_BOOKING: (id: string | number) => `/accept-booking/${id}`,
  REJECT_BOOKING: (id: string | number) => `/reject-booking/${id}`,
  COMPLETE_BOOKING: (id: string | number) => `/complete-booking/${id}`,

  // Feedback
  FEEDBACK_BUSINESS: (businessId: string | number) =>
    `/feedback/business/${businessId}`,
  FEEDBACK_BY_SERVICE: (serviceId: string | number) =>
    `/feedback/service/${serviceId}`,
  ADD_FEEDBACK: "/add-feedback",
} as const;

/**
 * Standard fetch options for authenticated requests
 */
export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  credentials: "include" as RequestCredentials,
});

/**
 * Helper function to make API requests
 * @param endpoint - API endpoint (relative to BASE_URL)
 * @param options - Fetch options
 * @returns Promise with response data
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
    }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

/**
 * API utility functions for common operations
 */
export const api = {
  get: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "GET" }),

  post: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),

  patch: <T = any>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
