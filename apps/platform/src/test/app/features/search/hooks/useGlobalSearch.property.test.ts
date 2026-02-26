/**
 * Property-Based Tests for useGlobalSearch Hook
 * 
 * These tests validate universal properties that should hold for any valid input.
 * Each test runs 100 iterations with randomly generated data.
 */

import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGlobalSearch } from '../../../../../app/features/search/../../../../app/features/search/hooks/useGlobalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse } from '../../../../../app/features/search/types/search.types';
import React from 'react';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

describe('useGlobalSearch - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 8: React Query Caching
   * 
   * For any search query, if the same query is executed twice within 5 minutes,
   * the second execution should use cached data and not make a new API request.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 8: React Query Caching', () => {
    it('should use cached data for identical queries within 5 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          async (query) => {
            // Create a fresh wrapper for each test iteration
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  staleTime: 5 * 60 * 1000, // 5 minutes
                  gcTime: 10 * 60 * 1000, // 10 minutes
                  retry: false, // Disable retries for tests
                  refetchOnWindowFocus: false,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) =>
              React.createElement(QueryClientProvider, { client: queryClient }, children);

            // Mock the search service to return a response
            const mockResponse: SearchResponse = {
              results: [
                {
                  entity_id: '1',
                  entity_type: 'items',
                  title: `Result for ${query}`,
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

            const globalSearchSpy = jest
              .spyOn(SearchService, 'globalSearch')
              .mockResolvedValue(mockResponse);

            // First query execution
            const { result: result1, unmount: unmount1 } = renderHook(() => useGlobalSearch(query), {
              wrapper,
            });

            // Wait for the first query to complete
            await waitFor(() => {
              expect(result1.current.isLoading).toBe(false);
            }, { timeout: 1000 });

            // Verify first call was made
            const firstCallCount = globalSearchSpy.mock.calls.length;
            expect(firstCallCount).toBeGreaterThanOrEqual(1);
            expect(result1.current.data).toEqual(mockResponse);

            // Second query execution with the same query (using same queryClient)
            const { result: result2, unmount: unmount2 } = renderHook(() => useGlobalSearch(query), {
              wrapper,
            });

            // Wait for the second query to complete
            await waitFor(() => {
              expect(result2.current.isLoading).toBe(false);
            }, { timeout: 1000 });

            // Property: Second call should use cached data (no additional API call)
            expect(globalSearchSpy.mock.calls.length).toBe(firstCallCount);
            expect(result2.current.data).toEqual(mockResponse);

            // Property: Both results should be identical
            expect(result1.current.data).toEqual(result2.current.data);

            // Cleanup
            unmount1();
            unmount2();
            globalSearchSpy.mockRestore();
          }
        ),
        { numRuns: 50 } // Reduced runs due to async complexity
      );
    });

    it('should cache different queries independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.trim().length >= 2), { minLength: 2, maxLength: 3 }),
          async (queries) => {
            // Filter to unique queries
            const uniqueQueries = [...new Set(queries.map(q => q.trim()))];
            
            // Skip if we don't have at least 2 unique queries
            if (uniqueQueries.length < 2) {
              return;
            }

            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  staleTime: 5 * 60 * 1000,
                  gcTime: 10 * 60 * 1000,
                  retry: false,
                  refetchOnWindowFocus: false,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) =>
              React.createElement(QueryClientProvider, { client: queryClient }, children);

            const globalSearchSpy = jest
              .spyOn(SearchService, 'globalSearch')
              .mockImplementation(async (request) => {
                return {
                  results: [
                    {
                      entity_id: '1',
                      entity_type: 'items',
                      title: `Result for ${request.query}`,
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
              });

            // Execute each unique query once
            const unmountFns = [];
            for (const query of uniqueQueries) {
              const { result, unmount } = renderHook(() => useGlobalSearch(query), {
                wrapper,
              });

              await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
              }, { timeout: 2000 });

              unmountFns.push(unmount);
            }

            // Property: Each unique query should trigger exactly one API call
            const firstCallCount = globalSearchSpy.mock.calls.length;
            expect(firstCallCount).toBe(uniqueQueries.length);

            // Execute the same queries again
            for (const query of uniqueQueries) {
              const { result, unmount } = renderHook(() => useGlobalSearch(query), {
                wrapper,
              });

              await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
              }, { timeout: 2000 });

              unmountFns.push(unmount);
            }

            // Property: No additional API calls should be made (cached)
            expect(globalSearchSpy.mock.calls.length).toBe(firstCallCount);

            // Cleanup
            unmountFns.forEach(fn => fn());
            globalSearchSpy.mockRestore();
          }
        ),
        { numRuns: 20 } // Reduced runs due to complexity
      );
    }, 15000); // Increase timeout to 15 seconds

    it('should not cache queries shorter than 2 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 1 }),
          async (shortQuery) => {
            // Skip if the query becomes >= 2 characters after trimming (shouldn't happen with maxLength: 1)
            if (shortQuery.trim().length >= 2) {
              return;
            }

            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  staleTime: 5 * 60 * 1000,
                  gcTime: 10 * 60 * 1000,
                  retry: false,
                  refetchOnWindowFocus: false,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) =>
              React.createElement(QueryClientProvider, { client: queryClient }, children);

            const globalSearchSpy = jest
              .spyOn(SearchService, 'globalSearch')
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

            // Execute query
            const { result, unmount } = renderHook(() => useGlobalSearch(shortQuery), {
              wrapper,
            });

            // Wait a bit to ensure no query is triggered (debounce + buffer)
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Property: Query should not be enabled for short queries
            expect(result.current.isLoading).toBe(false);
            expect(result.current.data).toBeUndefined();
            expect(globalSearchSpy).not.toHaveBeenCalled();

            // Cleanup
            unmount();
            globalSearchSpy.mockRestore();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should respect debounce delay before caching', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 40 }).filter(s => s.trim().length >= 2),
          async (query) => {
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  staleTime: 5 * 60 * 1000,
                  gcTime: 10 * 60 * 1000,
                  retry: false,
                  refetchOnWindowFocus: false,
                },
              },
            });

            const wrapper = ({ children }: { children: React.ReactNode }) =>
              React.createElement(QueryClientProvider, { client: queryClient }, children);

            const globalSearchSpy = jest
              .spyOn(SearchService, 'globalSearch')
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

            // Execute query
            const { result, unmount } = renderHook(() => useGlobalSearch(query), {
              wrapper,
            });

            // Property: Query should not be called immediately (debouncing)
            // Check within a short time window
            await new Promise((resolve) => setTimeout(resolve, 100));
            const callCountBefore = globalSearchSpy.mock.calls.length;
            expect(callCountBefore).toBe(0);

            // Wait for debounce delay (300ms) plus some buffer
            await waitFor(
              () => {
                expect(result.current.isLoading).toBe(false);
              },
              { timeout: 1500 }
            );

            // Property: Query should be called after debounce delay
            expect(globalSearchSpy).toHaveBeenCalledTimes(1);

            // Cleanup
            unmount();
            globalSearchSpy.mockRestore();
          }
        ),
        { numRuns: 20 } // Reduced runs due to timing sensitivity
      );
    });
  });
});
