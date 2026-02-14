/**
 * useGlobalSearch Hook
 * Encapsulates global search logic and state management using React Query
 */

import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from './useDebouncedValue';
import { SearchService } from '../services/search.service';
import { searchKeys } from '../constants/searchKeys';
import { useAuth } from '../../../hooks/useAuth';
import type { SearchResponse } from '../types/search.types';

/**
 * Hook for performing global search across all entity types
 * @param query - Search query string
 * @param page - Page number (1-indexed, defaults to 1)
 * @returns Search state and data
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useGlobalSearch(searchQuery, 1);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorMessage error={error} />;
 * return <SearchResults results={data?.results} />;
 * ```
 */
export function useGlobalSearch(query: string, page: number = 1) {
  const { accessToken } = useAuth();
  
  // Debounce the query to avoid excessive API calls
  const debouncedQuery = useDebouncedValue(query, 300);

  console.log('[useGlobalSearch] Hook called:', { query, debouncedQuery, page, enabled: debouncedQuery.length >= 2, hasToken: !!accessToken });

  // Use React Query to fetch search results
  const queryResult = useQuery<SearchResponse, Error>({
    queryKey: [...searchKeys.global(debouncedQuery), page],
    queryFn: async () => {
      console.log('[useGlobalSearch] Executing query function');
      return SearchService.globalSearch({
        query: debouncedQuery,
        page,
        page_size: 20,
        sort_by: 'created_at',
      }, accessToken || undefined);
    },
    // Only enable the query when the debounced query has at least 2 characters AND we have a token
    enabled: debouncedQuery.length >= 2 && !!accessToken,
    // Retry failed requests up to 2 times (configured in queryClient)
    // Cache results for 5 minutes (configured in queryClient)
  });

  console.log('[useGlobalSearch] Query result:', { 
    isLoading: queryResult.isLoading, 
    isError: queryResult.isError, 
    hasData: !!queryResult.data,
    error: queryResult.error 
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
