import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 2 minutes
      staleTime: 1000 * 60 * 2,
      // Keep in cache for 10 minutes after becoming inactive
      gcTime: 1000 * 60 * 10,
      // Retry failed requests once
      retry: 1,
      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      // Refetch when network reconnects
      refetchOnReconnect: true,
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Don't retry mutations by default
      retry: 0,
    },
  },
});
