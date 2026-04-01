/**
 * Query Invalidation Utilities
 *
 * Centralized functions to invalidate queries across all user roles
 * when booking data changes.
 */

import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './query-keys';

/**
 * Invalidate ALL booking-related queries across all user roles
 * Call this whenever:
 * - A new booking is created
 * - Booking status changes
 * - Payment is made
 * - Reschedule is requested/approved/declined
 * - Booking is cancelled/completed
 */
export function invalidateBookingQueries(queryClient: QueryClient) {
  // Invalidate customer booking queries - invalidate ALL variants
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS] });
  queryClient.invalidateQueries({ queryKey: ['bookings'] }); // fallback

  // Invalidate provider booking queries - invalidate ALL variants
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS] });
  queryClient.invalidateQueries({ queryKey: ['provider_bookings'] }); // fallback

  // Invalidate admin booking queries - invalidate ALL variants
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BOOKINGS] });
  queryClient.invalidateQueries({ queryKey: ['admin_bookings'] }); // fallback

  // Invalidate booking history
  queryClient.invalidateQueries({ queryKey: ['bookingHistory'] });

  // Invalidate dashboard stats
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_DASHBOARD] });

  // Invalidate services (in case booking affects availability)
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });

  // Invalidate slots (in case booking affects slot availability)
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SLOTS] });
}

/**
 * Invalidate notifications for all users
 * This uses the exact query keys from useNotifications hook
 */
export function invalidateNotificationQueries(queryClient: QueryClient) {
  // Invalidate notifications list - matches useNotifications() query key
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] }); // fallback

  // Invalidate unread count - matches useUnreadCount() query key
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, 'unreadCount'] });
  queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] }); // fallback
}

/**
 * Invalidate payment-related queries
 */
export function invalidatePaymentQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['payments'] });
  queryClient.invalidateQueries({ queryKey: ['payment-intents'] });
}

/**
 * Invalidate feedback queries
 */
export function invalidateFeedbackQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEEDBACK] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] });
}

/**
 * Invalidate all provider-related queries
 */
export function invalidateProviderQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_BOOKINGS] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_BUSINESS] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_SERVICES] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_DASHBOARD] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_REVENUE] });
}

/**
 * Invalidate all admin-related queries
 */
export function invalidateAdminQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BOOKINGS] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SERVICES] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_BUSINESSES] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_PAYOUTS] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'revenue'] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_ANALYTICS] });
}

/**
 * Complete invalidation after booking action
 * Use this after any booking mutation - invalidates bookings AND notifications
 */
export function invalidateAfterBookingAction(queryClient: QueryClient) {
  invalidateBookingQueries(queryClient);
  invalidateNotificationQueries(queryClient);
}
