/**
 * API Configuration and Utilities
 * Centralized API configuration for the Home Service Management frontend
 */

// Auto-detect environment and set appropriate API base URL
export function getApiBaseUrl(): string {
  // IMPORTANT: Runtime detection (hostname) takes precedence over build-time env vars
  // This ensures production deployments use production backend even if
  // .env.local has localhost:8000 (which is for local development only)

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Production frontend on Vercel
    if (hostname === 'homefixcare.vercel.app' || hostname.endsWith('.vercel.app')) {
      return 'https://homefixcare-backend.vercel.app';
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }

  // 2. Fall back to environment variable (for custom deployments)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // 3. Default fallback
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();

// Log API_BASE_URL for debugging
if (typeof window !== 'undefined') {
  console.log("=== API CONFIG ===");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log("Window location:", window.location.href);
  console.log("Hostname:", window.location.hostname);
  console.log("Environment:", process.env.NODE_ENV);
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

  // Google OAuth
  GOOGLE_AUTH: (role: string) => `/auth/google?role=${role}`,
  GOOGLE_CALLBACK: "/auth/google/callback",
  GOOGLE_UPDATE_PHONE: "/auth/google/update-phone",
  GOOGLE_LINK: "/auth/google/link",

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
  SLOT_BY_ID: (slotId: string | number) => `/slots/slot/${slotId}`,
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
  ADMIN_BOOKINGS_ALL: "/admin/bookings/all",
  ADD_BOOKING: "/add-booking",
  ACCEPT_BOOKING: (id: string | number) => `/accept-booking/${id}`,
  REJECT_BOOKING: (id: string | number) => `/reject-booking/${id}`,
  COMPLETE_BOOKING: (id: string | number) => `/complete-booking/${id}`,
  CANCEL_BOOKING: (id: string | number) => `/booking/${id}/cancel`,
  // Reschedule management (provider actions)
  APPROVE_RESCHEDULE: (id: string | number) => `/booking/${id}/reschedule-approve`,
  DECLINE_RESCHEDULE: (id: string | number) => `/booking/${id}/reschedule-decline`,
  PROVIDER_RESCHEDULE: (id: string | number) => `/booking/${id}/provider-reschedule`,
  PROVIDER_RESCHEDULE_SETTINGS: "/booking/provider/settings",
  PROVIDER_RESCHEDULE_SETTINGS_BY_BUSINESS: (businessId: string | number) =>
    `/booking/provider/settings/${businessId}`,

  // Feedback
  FEEDBACK_BUSINESS: (businessId: string | number) =>
    `/feedback/business/${businessId}`,
  FEEDBACK_BY_SERVICE: (serviceId: string | number) =>
    `/feedback/service/${serviceId}`,
  ADD_FEEDBACK: "/add-feedback",
  // Provider review management
  TOGGLE_REVIEW_VISIBILITY: (id: string | number) =>
    `/feedback/${id}/visibility`,
  ADD_PROVIDER_REPLY: (id: string | number) =>
    `/feedback/${id}/reply`,
  DELETE_REVIEW: (id: string | number) =>
    `/feedback/${id}`,

  // Invoice
  INVOICE_BY_BOOKING_ID: (bookingId: string | number) =>
    `/invoice/booking/${bookingId}`,

  // Payment Details (Admin & Provider)
  PAYMENT_DETAILS: "/payment-details",
  PAYMENT_DETAILS_SET_ACTIVE: (id: string | number) =>
    `/payment-details/${id}/set-active`,
  PAYMENT_DETAILS_DELETE: (id: string | number) =>
    `/payment-details/${id}`,
  ADMIN_CHECK_PAYMENT_DETAILS: "/admin/check-payment-details",

  // Admin Settings & Dashboard
  ADMIN_DASHBOARD_STATS: "/admin/dashboard/stats",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_REVENUE: "/admin/revenue",
  ADMIN_PAYOUTS: "/admin/payouts",
  ADMIN_PAYOUTS_BY_PROVIDER: "/admin/payouts/by-provider",

  // Provider Analytics
  PROVIDER_ANALYTICS_REVENUE: "/provider/analytics/revenue",
  PROVIDER_ANALYTICS_SERVICES: "/provider/analytics/services",
  PROVIDER_ANALYTICS_STATUS: "/provider/analytics/status",

  // Provider Revenue
  PROVIDER_REVENUE: "/admin/provider/revenue",

  // Payment
  PAYMENT: {
    CREATE_ORDER: "/payment/create-order",
    VERIFY: "/payment/verify",
    FAILED: "/payment/failed",
    CANCEL_INTENT: "/payment/cancel-intent",
    VALIDATE_INTENT: "/payment/validate-intent", // CRITICAL: Validate before opening Razorpay
    WEBHOOK: "/payment/webhook",
    BY_BOOKING: (bookingId: string | number) =>
      `/payment/booking/${bookingId}`,
    BY_ID: (paymentId: string | number) =>
      `/payment/${paymentId}`,
    REFUND: (paymentId: string | number) =>
      `/payment/refund/${paymentId}`,
  },
} as const;

/**
 * Standard fetch options for authenticated requests
 */
export const getAuthHeaders = () => {
  // Check both localStorage and sessionStorage for token
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  // Debug logging in production
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('[getAuthHeaders]', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasAuthHeader: !!token,
      localStorageHasToken: !!localStorage.getItem("token"),
      sessionStorageHasToken: !!sessionStorage.getItem("token"),
    });
  }

  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  };
};

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
  // Always detect API URL at runtime (not at build time)
  const apiUrl = getApiBaseUrl();
  const url = `${apiUrl}${endpoint}`;

  // Debug logging in production
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('[API Request]', {
      endpoint,
      apiUrl,
      fullUrl: url,
      hasToken: !!localStorage.getItem("token"),
    });
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: "include",
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
      code: undefined,
    }));

    // Create enhanced error with all response properties
    const enhancedError = new Error(error.message || "Request failed") as any;
    enhancedError.code = error.code;
    enhancedError.statusCode = response.status;
    enhancedError.retryable = error.retryable;
    enhancedError.cause = error; // Preserve original error data

    throw enhancedError;
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
