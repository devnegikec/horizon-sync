/**
 * useLocalSearch Hook
 * Encapsulates local search logic for specific entity types using React Query
 */

import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from './useDebouncedValue';
import { SearchService } from '../services/search.service';
import { searchKeys } from '../constants/searchKeys';
import { isValidEntityType } from '../constants/entityTypes';
import { useAuth } from '../../../hooks/useAuth';
import type { SearchResponse } from '../types/search.types';

/**
 * Hook for performing local search within a specific entity type
 * @param entityType - Entity type to search within (e.g., "items", "customers")
 * @param query - Search query string
 * @returns Search state and data
 * @throws Error if entityType is invalid
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useLocalSearch('items', searchQuery);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorMessage error={error} />;
 * return <SearchResults results={data?.results} />;
 * ```
 */
export function useLocalSearch(entityType: string, query: string) {
  const { accessToken } = useAuth();

  // Validate entity type
  if (!isValidEntityType(entityType)) {
    console.error(`Invalid entity type: ${entityType}`);
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(`Invalid entity type: ${entityType}`),
      refetch: async () => { throw new Error(`Invalid entity type: ${entityType}`); },
    };
  }

  // Debounce the query to avoid excessive API calls
  const debouncedQuery = useDebouncedValue(query, 300);

  // Use React Query to fetch search results
  const queryResult = useQuery<SearchResponse, Error>({
    queryKey: searchKeys.local(entityType, debouncedQuery),
    queryFn: async () => {
      return SearchService.localSearch(entityType, {
        query: debouncedQuery,
        page: 1,
        page_size: 20,
        sort_by: 'created_at',
      }, accessToken || undefined);
    },
    // Only enable the query when the debounced query has at least 2 characters AND we have a token
    enabled: debouncedQuery.length >= 2 && !!accessToken,
    // Retry failed requests up to 2 times (configured in queryClient)
    // Cache results for 5 minutes (configured in queryClient)
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
