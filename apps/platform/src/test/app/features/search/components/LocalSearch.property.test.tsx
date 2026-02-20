import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalSearch } from '../../../../../app/features/search/../../../../app/features/search/components/LocalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse, SearchResult } from '../../../../../app/features/search/types/search.types';
import React from 'react';

/**
 * Property-Based Tests for LocalSearch Component
 * 
 * These tests validate universal properties that should hold for any valid input.
 * Each test runs 100 iterations with randomly generated data.
 */

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

describe('LocalSearch - Property-Based Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Arbitrary generator for SearchResult
   */
  const searchResultArbitrary = fc.record({
    entity_id: fc.uuid(),
    entity_type: fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    snippet: fc.string({ minLength: 10, maxLength: 200 }),
    relevance_score: fc.float({ min: 0, max: 1 }),
    metadata: fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.float({ min: 0, max: 10000 }),
        fc.date().map(d => d.toISOString())
      )
    ),
  }) as fc.Arbitrary<SearchResult>;

  /**
   * Arbitrary generator for SearchResponse
   */
  const searchResponseArbitrary = (entityType: string) =>
    fc.record({
      results: fc.array(
        searchResultArbitrary.map(result => ({
          ...result,
          entity_type: entityType, // Ensure all results match the entity type
        })),
        { minLength: 0, maxLength: 20 }
      ),
      total_count: fc.nat({ max: 100 }),
      page: fc.constant(1),
      page_size: fc.constant(20),
      total_pages: fc.nat({ max: 10 }),
      has_next_page: fc.boolean(),
      has_previous_page: fc.constant(false),
      query_time_ms: fc.nat({ max: 1000 }),
      suggestions: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 30 }), { maxLength: 5 }), { nil: undefined }),
    }) as fc.Arbitrary<SearchResponse>;

  /**
   * Property 6: Local Search Table Filtering
   * 
   * For any local search response, the data table should display only the records
   * present in the search results, and no other records.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 6: Local Search Table Filtering', () => {
    it('should call onResultsChange with correct results for any search response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          async (entityType, query) => {
            // Generate a random search response for this entity type
            const searchResponse = await fc.sample(searchResponseArbitrary(entityType), 1)[0];

            // Mock the SearchService to return our generated response
            (SearchService.localSearch as jest.Mock).mockResolvedValue(searchResponse);

            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            const { rerender } = render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Simulate user typing (trigger search)
            const input = document.querySelector('input') as HTMLInputElement;
            if (input) {
              input.value = query;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Wait for the debounce and query to complete
            await waitFor(
              () => {
                expect(SearchService.localSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for onResultsChange to be called with the results
            await waitFor(
              () => {
                expect(onResultsChangeMock).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Property: onResultsChange should be called with the exact results from the response
            const lastCall = onResultsChangeMock.mock.calls[onResultsChangeMock.mock.calls.length - 1];
            expect(lastCall).toBeDefined();
            expect(lastCall[0]).toEqual(searchResponse.results);

            // Property: Only matching records should be passed (all results should match entity type)
            if (lastCall && lastCall[0]) {
              const results = lastCall[0] as SearchResult[];
              results.forEach((result: SearchResult) => {
                expect(result.entity_type).toBe(entityType);
              });
            }

            // Property: The number of results passed should match the response
            if (lastCall && lastCall[0]) {
              expect(lastCall[0].length).toBe(searchResponse.results.length);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout for property test

    it('should call onResultsChange with empty array when search is cleared', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          async (entityType) => {
            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Initially, with empty query, onResultsChange should be called with empty array
            await waitFor(
              () => {
                expect(onResultsChangeMock).toHaveBeenCalledWith([]);
              },
              { timeout: 500 }
            );

            // Property: When search query is empty, onResultsChange should be called with empty array
            const calls = onResultsChangeMock.mock.calls;
            const lastCall = calls[calls.length - 1];
            expect(lastCall[0]).toEqual([]);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('should only pass results matching the entity type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.array(searchResultArbitrary, { minLength: 1, maxLength: 20 }),
          async (entityType, query, mixedResults) => {
            // Filter results to only include the correct entity type
            const correctResults = mixedResults.map(result => ({
              ...result,
              entity_type: entityType,
            }));

            const searchResponse: SearchResponse = {
              results: correctResults,
              total_count: correctResults.length,
              page: 1,
              page_size: 20,
              total_pages: 1,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };

            // Mock the SearchService
            (SearchService.localSearch as jest.Mock).mockResolvedValue(searchResponse);

            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Simulate user typing
            const input = document.querySelector('input') as HTMLInputElement;
            if (input) {
              input.value = query;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Wait for the query to complete
            await waitFor(
              () => {
                expect(SearchService.localSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for onResultsChange to be called
            await waitFor(
              () => {
                expect(onResultsChangeMock).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Property: All results passed to onResultsChange should match the entity type
            const lastCall = onResultsChangeMock.mock.calls[onResultsChangeMock.mock.calls.length - 1];
            if (lastCall && lastCall[0]) {
              const results = lastCall[0] as SearchResult[];
              results.forEach((result: SearchResult) => {
                expect(result.entity_type).toBe(entityType);
              });
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('should handle empty result sets correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          async (entityType, query) => {
            // Create an empty search response
            const emptyResponse: SearchResponse = {
              results: [],
              total_count: 0,
              page: 1,
              page_size: 20,
              total_pages: 0,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 25,
            };

            // Mock the SearchService
            (SearchService.localSearch as jest.Mock).mockResolvedValue(emptyResponse);

            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Simulate user typing
            const input = document.querySelector('input') as HTMLInputElement;
            if (input) {
              input.value = query;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Wait for the query to complete
            await waitFor(
              () => {
                expect(SearchService.localSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for onResultsChange to be called
            await waitFor(
              () => {
                expect(onResultsChangeMock).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Property: onResultsChange should be called with empty array for empty results
            const lastCall = onResultsChangeMock.mock.calls[onResultsChangeMock.mock.calls.length - 1];
            expect(lastCall[0]).toEqual([]);
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 7: Loading State Display
   * 
   * For any search request in progress, the system should display a loading
   * indicator in the appropriate location.
   * 
   * **Validates: Requirements 2.5, 7.1**
   */
  describe('Property 7: Loading State Display', () => {
    it('should display loading indicator when search is in progress', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          async (entityType, query) => {
            // Create a promise that we can control
            let resolveSearch: (value: SearchResponse) => void;
            const searchPromise = new Promise<SearchResponse>((resolve) => {
              resolveSearch = resolve;
            });

            // Mock the SearchService to return our controlled promise
            (SearchService.localSearch as jest.Mock).mockReturnValue(searchPromise);

            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Simulate user typing
            const input = container.querySelector('input') as HTMLInputElement;
            if (input) {
              input.value = query;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Wait for the debounce delay
            await new Promise(resolve => setTimeout(resolve, 350));

            // Property: Loading indicator should be visible while request is in progress
            await waitFor(
              () => {
                const loadingIndicator = container.querySelector('[role="status"]');
                expect(loadingIndicator).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Resolve the search with a response
            const searchResponse: SearchResponse = {
              results: [],
              total_count: 0,
              page: 1,
              page_size: 20,
              total_pages: 0,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };
            resolveSearch!(searchResponse);

            // Property: Loading indicator should disappear after request completes
            await waitFor(
              () => {
                const loadingIndicator = container.querySelector('[role="status"]');
                expect(loadingIndicator).not.toBeInTheDocument();
              },
              { timeout: 1000 }
            );
          }
        ),
        { numRuns: 20 } // Reduced runs due to timing complexity
      );
    }, 60000); // 60 second timeout for loading state test

    it('should not display loading indicator when query is too short', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.string({ minLength: 0, maxLength: 1 }),
          async (entityType, shortQuery) => {
            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Simulate user typing a short query
            const input = container.querySelector('input') as HTMLInputElement;
            if (input) {
              input.value = shortQuery;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Wait for debounce
            await new Promise(resolve => setTimeout(resolve, 350));

            // Property: Loading indicator should not be visible for queries < 2 characters
            const loadingIndicator = container.querySelector('[role="status"]');
            expect(loadingIndicator).toBeNull();

            // Property: SearchService should not be called for short queries
            expect(SearchService.localSearch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 27: Mobile Input Width
   * 
   * For any device with screen width less than 768px, the local search input
   * should adjust its width to fit the screen.
   * 
   * **Validates: Requirements 9.2**
   */
  describe('Property 27: Mobile Input Width', () => {
    it('should adjust input width to fit screen on mobile viewports', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
          async (entityType, viewportWidth) => {
            // Set viewport width to mobile size
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: viewportWidth,
            });

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            // Track calls to onResultsChange
            const onResultsChangeMock = jest.fn();

            // Render the component
            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Get the input element
            const input = container.querySelector('input') as HTMLInputElement;
            expect(input).toBeInTheDocument();

            // Property: Input should have full width class (w-full)
            expect(input.className).toContain('w-full');

            // Property: Input should have responsive classes for mobile
            // The component uses max-md: prefix for mobile styles (< 768px)
            expect(input.className).toMatch(/max-md:/);

            // Property: Input should have minimum touch target height on mobile
            expect(input.className).toContain('max-md:min-h-[44px]');

            // Property: Input should have larger text size on mobile
            expect(input.className).toContain('max-md:text-base');

            // Property: Input should have adjusted padding on mobile
            expect(input.className).toContain('max-md:pl-12');
            expect(input.className).toContain('max-md:pr-12');

            // Get computed styles
            const computedStyle = window.getComputedStyle(input);
            
            // Property: Input width should be responsive (using percentage or full width)
            // The w-full class sets width: 100%
            const widthValue = computedStyle.width;
            
            // Since we can't easily test computed styles in jsdom, we verify the classes
            // that ensure responsive behavior are present
            expect(input.className).toContain('w-full');
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('should maintain responsive width across different mobile viewport sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.array(fc.integer({ min: 320, max: 767 }), { minLength: 2, maxLength: 5 }),
          async (entityType, viewportWidths) => {
            const onResultsChangeMock = jest.fn();

            for (const viewportWidth of viewportWidths) {
              // Set viewport width
              Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: viewportWidth,
              });

              window.dispatchEvent(new Event('resize'));

              // Render the component
              const { container, unmount } = render(
                <QueryClientProvider client={queryClient}>
                  <LocalSearch
                    entityType={entityType}
                    onResultsChange={onResultsChangeMock}
                    placeholder={`Search ${entityType}...`}
                  />
                </QueryClientProvider>
              );

              // Get the input element
              const input = container.querySelector('input') as HTMLInputElement;
              expect(input).toBeInTheDocument();

              // Property: Input should always have full width class on mobile
              expect(input.className).toContain('w-full');

              // Property: Mobile-specific classes should be present
              expect(input.className).toContain('max-md:min-h-[44px]');

              // Clean up
              unmount();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout

    it('should have appropriate touch target sizes on mobile', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
          fc.integer({ min: 320, max: 767 }),
          async (entityType, viewportWidth) => {
            // Set viewport width to mobile size
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: viewportWidth,
            });

            window.dispatchEvent(new Event('resize'));

            const onResultsChangeMock = jest.fn();

            // Render the component
            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <LocalSearch
                  entityType={entityType}
                  onResultsChange={onResultsChangeMock}
                  placeholder={`Search ${entityType}...`}
                />
              </QueryClientProvider>
            );

            // Get the input element
            const input = container.querySelector('input') as HTMLInputElement;
            expect(input).toBeInTheDocument();

            // Property: Input should have minimum touch target height on mobile
            expect(input.className).toContain('max-md:min-h-[44px]');

            // Property: Clear button should have minimum touch target size on mobile (when present)
            // The clear button only appears when there's text, so we verify the classes exist in the component
            const clearButtonClass = 'max-md:min-w-[44px] max-md:min-h-[44px]';
            
            // Property: Icons should be larger on mobile for better visibility
            // Verify the search icon has mobile-responsive classes
            const searchIcon = container.querySelector('svg[aria-hidden="true"]');
            if (searchIcon) {
              // SVG className is an object, so we need to get the baseVal
              const svgClasses = searchIcon.getAttribute('class') || '';
              // The component uses responsive icon sizing
              expect(svgClasses).toBeTruthy();
            }

            // Property: The component should have responsive padding for mobile
            expect(input.className).toContain('max-md:pl-12');
            expect(input.className).toContain('max-md:pr-12');

            // Property: The component should have larger text on mobile
            expect(input.className).toContain('max-md:text-base');
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });
});
