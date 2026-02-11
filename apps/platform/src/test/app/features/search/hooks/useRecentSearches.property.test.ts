import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from '../../../../../app/features/search/../../../../app/features/search/hooks/useRecentSearches';

/**
 * Property-Based Tests for useRecentSearches Hook
 * 
 * These tests validate universal properties that should hold for any valid input.
 * Each test runs 100 iterations with randomly generated data.
 */

describe('useRecentSearches - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Also clear after each test to prevent cross-contamination
    localStorage.clear();
  });

  /**
   * Property 23: Recent Searches Limit
   * 
   * For any sequence of search queries, the number of recent searches
   * stored should never exceed 5.
   * 
   * **Validates: Requirements 8.2**
   */
  describe('Property 23: Recent Searches Limit', () => {
    it('should never exceed 5 recent searches for any sequence of queries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
          (queries) => {
            // Clear localStorage for this property test iteration
            localStorage.clear();
            
            const { result } = renderHook(() => useRecentSearches());

            // Add all queries
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: List should never exceed 5 items
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);

            // Count valid queries (non-empty after trimming)
            const validQueries = queries.filter((q) => q.trim().length > 0);
            const uniqueValidQueries = [...new Set(validQueries.map((q) => q.trim()))];

            // Property: If we added 5+ valid unique queries, list should be exactly 5
            if (uniqueValidQueries.length >= 5) {
              expect(result.current.recentSearches.length).toBe(5);
            } else if (uniqueValidQueries.length > 0) {
              // Otherwise, list should match the number of unique valid queries
              expect(result.current.recentSearches.length).toBe(uniqueValidQueries.length);
            } else {
              // If no valid queries, list should be empty
              expect(result.current.recentSearches.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain limit of 5 even with duplicate queries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 2, max: 10 }),
          (baseQueries, repeatCount) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add queries multiple times
            for (let i = 0; i < repeatCount; i++) {
              baseQueries.forEach((query) => {
                act(() => {
                  result.current.addSearch(query);
                });
              });
            }

            // Property: List should never exceed 5 items regardless of duplicates
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain limit after adding empty or whitespace queries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 50 }),
              fc.constant(''),
              fc.constant('   '),
              fc.constant('\t\n')
            ),
            { minLength: 5, maxLength: 15 }
          ),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add all queries (including empty ones)
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: List should never exceed 5 items
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);

            // Property: All stored queries should be non-empty
            result.current.recentSearches.forEach((search) => {
              expect(search.query.trim().length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 25: Recent Search Deduplication
   * 
   * For any search query that already exists in the recent searches list,
   * executing that query again should move it to the top of the list (index 0)
   * rather than creating a duplicate entry.
   * 
   * **Validates: Requirements 8.4**
   */
  describe('Property 25: Recent Search Deduplication', () => {
    it('should move duplicate searches to top of list', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 4 }),
          (queries, duplicateIndex) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add initial queries
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Get a query that exists in the list
            const existingQuery =
              result.current.recentSearches[
                duplicateIndex % result.current.recentSearches.length
              ]?.query;

            if (existingQuery) {
              const lengthBefore = result.current.recentSearches.length;

              // Add the duplicate
              act(() => {
                result.current.addSearch(existingQuery);
              });

              // Property: It should be at the top (index 0)
              expect(result.current.recentSearches[0].query).toBe(existingQuery);

              // Property: List length should not increase
              expect(result.current.recentSearches.length).toBe(lengthBefore);

              // Property: No duplicates should exist
              const queryStrings = result.current.recentSearches.map((s) => s.query);
              const uniqueQueries = new Set(queryStrings);
              expect(queryStrings.length).toBe(uniqueQueries.size);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-sensitive deduplication correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 2, maxLength: 8 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add queries
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Pick a query and add it with different casing
            if (result.current.recentSearches.length > 0) {
              const originalQuery = result.current.recentSearches[0].query;
              const upperCaseQuery = originalQuery.toUpperCase();
              const lowerCaseQuery = originalQuery.toLowerCase();

              // Add uppercase version
              act(() => {
                result.current.addSearch(upperCaseQuery);
              });

              // Property: Case-sensitive deduplication - different cases are different queries
              const queryStrings = result.current.recentSearches.map((s) => s.query);
              
              // If original was not all uppercase, uppercase version should be separate
              if (originalQuery !== upperCaseQuery) {
                expect(queryStrings).toContain(upperCaseQuery);
              }

              // Property: No exact duplicates should exist
              const uniqueQueries = new Set(queryStrings);
              expect(queryStrings.length).toBe(uniqueQueries.size);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deduplicate trimmed queries correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 40 }), { minLength: 2, maxLength: 8 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add queries
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Pick a query and add it with extra whitespace
            if (result.current.recentSearches.length > 0) {
              const originalQuery = result.current.recentSearches[0].query;
              const paddedQuery = `  ${originalQuery}  `;

              const lengthBefore = result.current.recentSearches.length;

              // Add padded version
              act(() => {
                result.current.addSearch(paddedQuery);
              });

              // Property: Trimmed version should be deduplicated
              expect(result.current.recentSearches[0].query).toBe(originalQuery);

              // Property: List length should not increase
              expect(result.current.recentSearches.length).toBe(lengthBefore);

              // Property: No duplicates should exist
              const queryStrings = result.current.recentSearches.map((s) => s.query);
              const uniqueQueries = new Set(queryStrings);
              expect(queryStrings.length).toBe(uniqueQueries.size);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify no duplicate entries exist after any sequence of operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              query: fc.string({ minLength: 1, maxLength: 50 }),
              repeat: fc.integer({ min: 1, max: 3 }),
            }),
            { minLength: 3, maxLength: 15 }
          ),
          (operations) => {
            const { result } = renderHook(() => useRecentSearches());

            // Execute operations
            operations.forEach((op) => {
              for (let i = 0; i < op.repeat; i++) {
                act(() => {
                  result.current.addSearch(op.query);
                });
              }
            });

            // Property: No duplicate entries should exist
            const queryStrings = result.current.recentSearches.map((s) => s.query);
            const uniqueQueries = new Set(queryStrings);
            expect(queryStrings.length).toBe(uniqueQueries.size);

            // Property: Each query should appear exactly once
            queryStrings.forEach((query) => {
              const count = queryStrings.filter((q) => q === query).length;
              expect(count).toBe(1);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Recent Search Eviction
   * 
   * When adding a new search and 5 recent searches already exist,
   * the oldest search should be removed from the list.
   * 
   * **Validates: Requirements 8.3**
   */
  describe('Property 24: Recent Search Eviction', () => {
    it('should remove oldest search when limit is reached', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 6, maxLength: 20 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Filter to only valid queries (non-empty after trimming)
            const validQueries = queries.filter((q) => q.trim().length > 0);
            
            // If we don't have enough valid queries, skip this test case
            if (validQueries.length < 6) {
              return;
            }

            // Add all valid queries
            validQueries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: List should never exceed 5
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);

            // Property: Final list should contain at most 5 items
            const finalQueries = result.current.recentSearches.map((s) => s.query);
            expect(finalQueries.length).toBeLessThanOrEqual(5);

            // Property: Most recent valid query should be at index 0
            const lastValidQuery = validQueries[validQueries.length - 1].trim();
            expect(finalQueries[0]).toBe(lastValidQuery);

            // Property: The very first query should not be in the list
            // (unless it was re-added later as a duplicate)
            const firstQuery = validQueries[0].trim();
            const wasReAdded = validQueries.slice(1).some((q) => q.trim() === firstQuery);
            if (!wasReAdded) {
              expect(finalQueries).not.toContain(firstQuery);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct order after eviction', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 40 }), { minLength: 7, maxLength: 15 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Filter to only valid queries (non-empty after trimming)
            const validQueries = queries.filter((q) => q.trim().length > 0);
            
            // If we don't have enough valid queries, skip this test case
            if (validQueries.length < 7) {
              return;
            }

            // Add all valid queries
            validQueries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: Queries should be in reverse chronological order
            const timestamps = result.current.recentSearches.map((s) => s.timestamp);
            for (let i = 0; i < timestamps.length - 1; i++) {
              expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
            }

            // Property: Most recent valid query should be first
            const lastValidQuery = validQueries[validQueries.length - 1].trim();
            expect(result.current.recentSearches[0].query).toBe(lastValidQuery);

            // Property: List should be at most 5 items
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should evict correctly with mixed unique and duplicate queries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 3, maxLength: 8 }),
          fc.integer({ min: 2, max: 5 }),
          (uniqueQueries, extraCount) => {
            // Clear localStorage for this property test iteration
            localStorage.clear();
            
            const { result } = renderHook(() => useRecentSearches());

            // Filter to only valid queries (non-empty after trimming)
            const validQueries = uniqueQueries.filter((q) => q.trim().length > 0);
            
            // If we don't have enough valid queries, skip this test case
            if (validQueries.length < 3) {
              return;
            }

            // Track all queries we actually add (trimmed versions)
            const addedQueries: string[] = [];

            // Add initial queries (up to 5)
            const initial5 = validQueries.slice(0, 5);
            initial5.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
              addedQueries.push(query.trim());
            });

            // Add extra queries (may include duplicates)
            for (let i = 0; i < extraCount; i++) {
              const queryToAdd = validQueries[i % validQueries.length];
              act(() => {
                result.current.addSearch(queryToAdd);
              });
              addedQueries.push(queryToAdd.trim());
            }

            // Property: List should never exceed 5
            expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);

            // Property: No duplicates should exist
            const queryStrings = result.current.recentSearches.map((s) => s.query);
            const uniqueSet = new Set(queryStrings);
            expect(queryStrings.length).toBe(uniqueSet.size);

            // Property: All queries in the result should be from the queries we added
            queryStrings.forEach((query) => {
              expect(addedQueries).toContain(query);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist eviction to localStorage', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 6, maxLength: 12 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add all queries
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: localStorage should contain exactly 5 items
            const stored = localStorage.getItem('erp_recent_searches');
            expect(stored).toBeTruthy();
            
            if (stored) {
              const parsed = JSON.parse(stored);
              expect(parsed.length).toBe(5);

              // Property: localStorage should match state
              const stateQueries = result.current.recentSearches.map((s) => s.query);
              const storedQueries = parsed.map((s: { query: string }) => s.query);
              expect(storedQueries).toEqual(stateQueries);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional Property: Timestamp Ordering
   * 
   * For any sequence of operations, timestamps should always be in
   * descending order (most recent first).
   */
  describe('Additional Property: Timestamp Ordering', () => {
    it('should maintain descending timestamp order', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          (queries) => {
            const { result } = renderHook(() => useRecentSearches());

            // Add queries with small delays to ensure different timestamps
            queries.forEach((query) => {
              act(() => {
                result.current.addSearch(query);
              });
            });

            // Property: Timestamps should be in descending order
            const timestamps = result.current.recentSearches.map((s) => s.timestamp);
            for (let i = 0; i < timestamps.length - 1; i++) {
              expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
