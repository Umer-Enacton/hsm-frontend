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

    // Local development (any localhost port)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }

    // IP-based local access
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return 'http://localhost:8000';
    }
  }

  // 2. Fall back to environment variable (for custom deployments)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // 3. Default fallback (NEVER return undefined)
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
  CHANGE_PASSWORD: "/user/change-password",

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
  BOOKING_HISTORY: (id: string | number) => `/booking/${id}/history`,
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
  // OTP-based completion verification (provider actions)
  INITIATE_COMPLETION: (id: string | number) => `/booking/${id}/complete-initiate`,
  VERIFY_COMPLETION_OTP: (id: string | number) => `/booking/${id}/complete-verify`,
  RESEND_COMPLETION_OTP: (id: string | number) => `/booking/${id}/complete-resend`,
  UPLOAD_COMPLETION_PHOTOS: (id: string | number) => `/booking/${id}/completion-photos`,
  // Staff assignment
  BOOKING_ASSIGN_STAFF: (id: string | number) => `/booking/${id}/assign-staff`,
  BOOKING_UNASSIGN_STAFF: (id: string | number) => `/booking/${id}/unassign-staff`,
  BOOKING_AVAILABLE_STAFF: "/booking/available-staff",
  BOOKING_STAFF_MY_BOOKINGS: "/bookings/staff/my-bookings",
  BOOKING_COMPLETE_WITH_PAYOUT: (id: string | number) => `/booking/${id}/complete-with-payout`,
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
  ADMIN_CANCELLATION_POLICY: "/admin/settings/cancellation-policy",
  PRIVACY_POLICY_ACTIVE: "/privacy-policies/active",
  ADMIN_PRIVACY_POLICIES: "/privacy-policies/versions",
  ADMIN_PRIVACY_POLICY_BY_ID: (id: string | number) => `/privacy-policies/versions/${id}`,
  ADMIN_PRIVACY_POLICY_CREATE: "/privacy-policies",
  ADMIN_PRIVACY_POLICY_UPDATE: (id: string | number) => `/privacy-policies/${id}`,
  ADMIN_PRIVACY_POLICY_ACTIVATE: (id: string | number) => `/privacy-policies/${id}/activate`,
  ADMIN_PRIVACY_POLICY_DELETE: (id: string | number) => `/privacy-policies/${id}`,
  // Terms & Conditions
  TERMS_ACTIVE: "/terms-conditions/active",
  ADMIN_TERMS_VERSIONS: "/terms-conditions/versions",
  ADMIN_TERMS_BY_ID: (id: string | number) => `/terms-conditions/versions/${id}`,
  ADMIN_TERMS_CREATE: "/terms-conditions",
  ADMIN_TERMS_UPDATE: (id: string | number) => `/terms-conditions/${id}`,
  ADMIN_TERMS_ACTIVATE: (id: string | number) => `/terms-conditions/${id}/activate`,
  ADMIN_TERMS_DELETE: (id: string | number) => `/terms-conditions/${id}`,
  ADMIN_REVENUE: "/admin/revenue",
  ADMIN_PAYOUTS: "/admin/payouts",
  ADMIN_PAYOUTS_BY_PROVIDER: "/admin/payouts/by-provider",

  // Admin Analytics
  ADMIN_ANALYTICS_REVENUE: (period: string) => `/admin/analytics/revenue?period=${period}`,
  ADMIN_ANALYTICS_CATEGORIES: (period: string) => `/admin/analytics/categories?period=${period}`,
  ADMIN_ANALYTICS_STATUS: (period: string) => `/admin/analytics/status?period=${period}`,
  ADMIN_ANALYTICS_PROVIDERS: (period: string) => `/admin/analytics/providers?period=${period}`,
  ADMIN_ANALYTICS_PAYMENT_STATUS: (period: string) => `/admin/analytics/payment-status?period=${period}`,
  ADMIN_ANALYTICS_AVERAGE_ORDER_VALUE: (period: string) => `/admin/analytics/average-order-value?period=${period}`,

  // Provider Analytics
  PROVIDER_ANALYTICS_REVENUE: "/provider/analytics/revenue",
  PROVIDER_ANALYTICS_SERVICES: "/provider/analytics/services",
  PROVIDER_ANALYTICS_STATUS: "/provider/analytics/status",
  PROVIDER_ANALYTICS_TIME_PATTERNS: "/provider/analytics/time-patterns",

  // Provider Revenue (provider's own earnings)
  // Note: This route is in admin.route.js but accessible by providers
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

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/notifications/unread-count",
  NOTIFICATIONS_MARK_READ: "/notifications/mark-read",
  NOTIFICATION_DELETE: (id: string | number) => `/notifications/${id}`,

  // Device Tokens (FCM)
  DEVICE_TOKEN_REGISTER: "/device-tokens/register",
  DEVICE_TOKEN_UNREGISTER: "/device-tokens/unregister",

  // Provider Status (blocking/deactivation info)
  PROVIDER_STATUS: "/provider/status",

  // Admin - Business/Service Management
  ADMIN_SERVICES: "/admin/services",
  ADMIN_BLOCK_BUSINESS: (id: string | number) => `/admin/business/${id}/block`,
  ADMIN_UNBLOCK_BUSINESS: (id: string | number) => `/admin/business/${id}/unblock`,
  ADMIN_DEACTIVATE_SERVICE: (id: string | number) => `/admin/services/${id}/deactivate`,
  ADMIN_ACTIVATE_SERVICE: (id: string | number) => `/admin/services/${id}/activate`,

  // Subscription Plans (Admin)
  SUBSCRIPTION_PLANS: "/subscription/plans",
  SUBSCRIPTION_PLAN_BY_ID: (id: string | number) => `/subscription/plans/${id}`,

  // Provider Subscriptions
  PROVIDER_SUBSCRIPTION_CURRENT: "/provider/subscription/current",
  PROVIDER_SUBSCRIPTION_PURCHASE_LINK: "/provider/subscription/purchase-link", // Razorpay Subscription Links API (hosted page)
  PROVIDER_SUBSCRIPTION_AUTHORIZE: "/provider/subscription/authorize", // Get subscription details for checkout authorization
  PROVIDER_SUBSCRIPTION_START_TRIAL: "/provider/subscription/start-trial", // Start free trial (database-level, no Razorpay)
  PROVIDER_SUBSCRIPTION_CANCEL_PENDING: "/provider/subscription/cancel-pending", // Cancel pending subscription when modal closed
  PROVIDER_SUBSCRIPTION_CANCEL: "/provider/subscription/cancel",
  PROVIDER_SUBSCRIPTION_TOGGLE_AUTO_RENEW: "/provider/subscription/toggle-auto-renew",
  PROVIDER_SUBSCRIPTION_UPGRADE: "/provider/subscription/upgrade",
  PROVIDER_SUBSCRIPTION_CLEANUP: "/provider/subscription/cleanup", // Cleanup abandoned pending subscriptions
  PROVIDER_SUBSCRIPTION_PAYMENTS: "/provider/subscription/payments",
  PROVIDER_SUBSCRIPTION_ALL: "/provider/subscription/providers", // Admin: Get all provider subscriptions

  // Admin Subscription Management
  ADMIN_PROVIDER_SUBSCRIPTIONS: "/admin/provider-subscriptions",
  ADMIN_SUBSCRIPTION_CANCEL: (id: string | number) => `/admin/provider-subscriptions/${id}/cancel`,
  ADMIN_SUBSCRIPTION_TOGGLE_AUTO_RENEW: (id: string | number) => `/admin/provider-subscriptions/${id}/toggle-auto-renew`,
  ADMIN_SUBSCRIPTION_EXTEND: (id: string | number) => `/admin/provider-subscriptions/${id}/extend`,
  ADMIN_SUBSCRIPTION_REFUND: (id: string | number) => `/admin/provider-subscriptions/${id}/refund`,

  // Admin Cron Job Management
  ADMIN_CRON_JOBS: "/admin/cron-jobs/jobs",
  ADMIN_CRON_JOB_BY_ID: (id: string | number) => `/admin/cron-jobs/jobs/${id}`,
  ADMIN_CRON_JOB_TRIGGER: (id: string | number) => `/admin/cron-jobs/jobs/${id}/trigger`,
  ADMIN_CRON_JOB_LOGS: (id: string | number) => `/admin/cron-jobs/jobs/${id}/logs`,
  ADMIN_CRON_STATS: "/admin/cron-jobs/stats",
  ADMIN_CRON_JOB_SYNC: (id: string | number) => `/admin/cron-jobs/jobs/${id}/sync`,
  ADMIN_CRON_JOBS_SYNC_ALL: "/admin/cron-jobs/jobs/sync-all",
  ADMIN_CRON_SYNC_STATUS: "/admin/cron-jobs/jobs/sync-status",

  // Staff Management (Provider)
  STAFF: "/staff",
  STAFF_ME: "/staff/me",
  STAFF_BY_ID: (id: string | number) => `/staff/${id}`,
  STAFF_AVAILABLE: "/staff/available",
  STAFF_UPDATE_STATUS: (id: string | number) => `/staff/${id}/status`,

  // Staff Leave Management
  STAFF_LEAVE: "/staff-leave",
  STAFF_LEAVE_BUSINESS: "/staff-leave/business",
  STAFF_LEAVE_ON_LEAVE: "/staff-leave/on-leave",
  STAFF_LEAVE_MY_LEAVE: "/staff-leave/my-leave",
  STAFF_LEAVE_APPROVE: (id: string | number) => `/staff-leave/${id}/approve`,
  STAFF_LEAVE_REJECT: (id: string | number) => `/staff-leave/${id}/reject`,
  STAFF_LEAVE_CANCEL: (id: string | number) => `/staff-leave/${id}/cancel`,

  // Staff Payouts
  STAFF_PAYOUTS_MY_EARNINGS: "/staff-payouts/my-earnings",
  STAFF_PAYOUTS_MY_PAYOUTS: "/staff-payouts/my-payouts",
  STAFF_PAYOUTS_BUSINESS: "/staff-payouts/business",
  STAFF_PAYOUTS_SUMMARY: "/staff-payouts/summary",
  STAFF_PAYOUTS_PROCESS: "/staff-payouts/process",
  STAFF_PAYOUTS_PROVIDER_SUMMARY: "/staff-payouts/provider-summary",
  STAFF_PAYOUTS_PROVIDER_PROCESS: "/staff-payouts/provider-process",
} as const;

/**
 * Standard fetch options for authenticated requests
 */
export const getAuthHeaders = () => {
  // Check both localStorage and sessionStorage for token
  let token = null;
  if (typeof window !== 'undefined') {
    const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    // Explicitly check for 'null' or 'undefined' strings which can break the backend
    if (rawToken && rawToken !== 'null' && rawToken !== 'undefined') {
      token = rawToken;
    }
  }

  // Debug logging in production
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('[getAuthHeaders]', {
      hasToken: !!token,
      tokenLength: token?.length,
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
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Always detect API URL at runtime (not at build time)
  const apiUrl = getApiBaseUrl() || 'http://localhost:8000'; // Safety fallback
  const url = `${apiUrl}${endpoint}`;

  // Debug logging for all requests
  if (typeof window !== 'undefined') {
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
    const enhancedError = new Error(error.message || "Request failed") as Error & Record<string, unknown>;
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
  get: <T = unknown>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "GET" }),

  post: <T = unknown>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T = unknown>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T = unknown>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),

  patch: <T = unknown>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
