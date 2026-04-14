/**
 * Simple Query Keys Constants
 *
 * Instead of complex nested functions, use these base strings inside your queryKey arrays.
 *
 * Example:
 *   // Before: queryKey: queryKeys.bookings.list(filters)
 *   // After:  queryKey: [QUERY_KEYS.BOOKINGS, "list", filters]
 */

export const QUERY_KEYS = {
  ADDRESS: "address",
  BOOKINGS: "bookings",
  SERVICES: "services",
  SLOTS: "slots",
  PROFILE: "profile",
  CATEGORIES: "categories",
  NOTIFICATIONS: "notifications",
  REVIEWS: "reviews",
  FEEDBACK: "feedback",
  USERS: "users",
  STAFF_PAYOUTS: "staff_payouts",

  // Provider specific base keys
  PROVIDER_BOOKINGS: "provider_bookings",
  PROVIDER_BUSINESS: "provider_business",
  PROVIDER_SERVICES: "provider_services",
  PROVIDER_DASHBOARD: "provider_dashboard",
  PROVIDER_REVENUE: "provider_revenue",
  PROVIDER_ANALYTICS: "provider_analytics",
  PROVIDER_REVIEWS: "provider_reviews",
  PROVIDER_STAFF: "provider_staff",

  // Admin specific base keys
  ADMIN_ANALYTICS: "admin_analytics",
  ADMIN_BOOKINGS: "admin_bookings",
  ADMIN_SERVICES: "admin_services",
  ADMIN_BUSINESSES: "admin_businesses",
  ADMIN_PAYOUTS: "admin_payouts",
  ADMIN_SETTINGS: "admin_settings",
  ADMIN_PRIVACY_POLICIES: "admin_privacy_policies",
  ADMIN_TERMS_CONDITIONS: "admin_terms_conditions",

  // Global shared base keys
  GLOBAL_PRIVACY_POLICY: "global_privacy_policy",
  GLOBAL_TERMS_CONDITIONS: "global_terms_conditions",
} as const;
