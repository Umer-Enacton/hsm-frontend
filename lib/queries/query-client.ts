import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes (was 2 min - too short)
      staleTime: 1000 * 60 * 5,
      // Keep in cache for 30 minutes after becoming inactive (was 10 min)
      gcTime: 1000 * 60 * 30,
      // Retry failed requests once
      retry: 1,
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Disable refetch when window regains focus to avoid excessive network requests
      refetchOnWindowFocus: false,
      // Refetch when network reconnects
      refetchOnReconnect: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});

/**
 * Cache time guidelines:
 *
 * staleTime - How long data is considered "fresh" (no refetch during this time)
 * - Static data (categories, services list): 30 minutes
 * - User profile: 15 minutes
 * - Dashboard stats: 5-10 minutes
 * - Bookings, notifications: 2-5 minutes
 * - Analytics: 10-15 minutes
 *
 * gcTime (garbage collection) - How long to keep unused data in cache
 * - Should be longer than staleTime
 * - Static data: 1 hour
 * - User data: 30 minutes
 * - Dashboard/Analytics: 30 minutes
 */
