/**
 * Unit Tests for useLocalSearch Hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocalSearch } from '../../../../../app/features/search/../../../../app/features/search/hooks/useLocalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse } from '../../../../../app/features/search/types/search.types';
import React from 'react';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

/**
 * Create a wrapper with QueryClient for testing
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: false, // Disable retries for tests
        refetchOnWindowFocus: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useLocalSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('entity type validation', () => {
    it('should accept valid entity type', () => {
      const wrapper = createWrapper();

      // Mock the search service
      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      jest.spyOn(SearchService, 'localSearch').mockResolvedValue(mockResponse);

      // Should not throw for valid entity type
      const { result } = renderHook(() => useLocalSearch('items', 'test query'), {
        wrapper,
      });

      expect(result.current).toBeDefined();
    });

    it('should throw error for invalid entity type', () => {
      const wrapper = createWrapper();

      // Should throw for invalid entity type
      expect(() => {
        renderHook(() => useLocalSearch('invalid_type', 'test query'), {
          wrapper,
        });
      }).toThrow('Invalid entity type: invalid_type');
    });

    it('should accept all valid entity types', () => {
      const wrapper = createWrapper();
      const validTypes = ['items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'];

      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      jest.spyOn(SearchService, 'localSearch').mockResolvedValue(mockResponse);

      validTypes.forEach((entityType) => {
        expect(() => {
          renderHook(() => useLocalSearch(entityType, 'test'), {
            wrapper,
          });
        }).not.toThrow();
      });
    });
  });

  describe('debouncing behavior', () => {
    it('should debounce query changes', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue(mockResponse);

      const { result, rerender } = renderHook(
        ({ query }) => useLocalSearch('items', query),
        {
          wrapper,
          initialProps: { query: 'test' },
        }
      );

      // Wait for debounce delay
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      // Should have called once after debounce
      expect(localSearchSpy).toHaveBeenCalledTimes(1);

      // Change query
      rerender({ query: 'test2' });

      // Wait for debounce delay
      await waitFor(
        () => {
          expect(localSearchSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('query enabled condition', () => {
    it('should not enable query when length < 2', async () => {
      const wrapper = createWrapper();

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue({
          results: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
          has_next_page: false,
          has_previous_page: false,
          query_time_ms: 10,
        });

      const { result } = renderHook(() => useLocalSearch('items', 'a'), {
        wrapper,
      });

      // Wait a bit to ensure no query is triggered
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not have called the API
      expect(localSearchSpy).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('should enable query when length >= 2', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [
          {
            entity_id: '1',
            entity_type: 'items',
            title: 'Test Item',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {},
          },
        ],
        total_count: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 50,
      };

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocalSearch('items', 'test'), {
        wrapper,
      });

      // Wait for debounce and query to complete
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      // Should have called the API
      expect(localSearchSpy).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockResponse);
    });

    it('should not enable query for empty string', async () => {
      const wrapper = createWrapper();

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue({
          results: [],
          total_count: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
          has_next_page: false,
          has_previous_page: false,
          query_time_ms: 10,
        });

      const { result } = renderHook(() => useLocalSearch('items', ''), {
        wrapper,
      });

      // Wait a bit to ensure no query is triggered
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not have called the API
      expect(localSearchSpy).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('search functionality', () => {
    it('should call SearchService.localSearch with correct parameters', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue(mockResponse);

      renderHook(() => useLocalSearch('customers', 'test query'), {
        wrapper,
      });

      // Wait for debounce and query to complete
      await waitFor(
        () => {
          expect(localSearchSpy).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      // Verify correct parameters
      expect(localSearchSpy).toHaveBeenCalledWith('customers', {
        query: 'test query',
      });
    });

    it('should return search results', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [
          {
            entity_id: '1',
            entity_type: 'items',
            title: 'Test Item',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {},
          },
        ],
        total_count: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 50,
      };

      jest.spyOn(SearchService, 'localSearch').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocalSearch('items', 'test'), {
        wrapper,
      });

      // Wait for query to complete
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      // Verify results
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors', async () => {
      const wrapper = createWrapper();

      const mockError = new Error('Search failed');

      jest.spyOn(SearchService, 'localSearch').mockRejectedValue(mockError);

      const { result } = renderHook(() => useLocalSearch('items', 'test'), {
        wrapper,
      });

      // Wait for query to complete
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      // Verify error state
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('return values', () => {
    it('should return all required properties', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      jest.spyOn(SearchService, 'localSearch').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocalSearch('items', 'test'), {
        wrapper,
      });

      // Check that all required properties exist
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
    });

    it('should provide refetch function', async () => {
      const wrapper = createWrapper();

      const mockResponse: SearchResponse = {
        results: [],
        total_count: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
        has_next_page: false,
        has_previous_page: false,
        query_time_ms: 10,
      };

      const localSearchSpy = jest
        .spyOn(SearchService, 'localSearch')
        .mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLocalSearch('items', 'test'), {
        wrapper,
      });

      // Wait for initial query
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 1000 }
      );

      expect(localSearchSpy).toHaveBeenCalledTimes(1);

      // Call refetch
      await result.current.refetch();

      // Should have called again
      expect(localSearchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
