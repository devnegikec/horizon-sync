/**
 * React Query Client Configuration
 * Configures caching, retries, and other query behaviors for search functionality
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Query client instance with optimized settings for search
 * - staleTime: 5 minutes - cached data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - cached data is kept in memory for 10 minutes
 * - retry: 2 - failed requests are retried up to 2 times
 * - refetchOnWindowFocus: false - don't refetch when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
