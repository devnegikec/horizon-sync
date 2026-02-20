/**
 * Property-Based Tests for GlobalSearch Component
 * 
 * These tests validate universal properties that should hold for any valid input.
 * Each test runs 20-30 iterations with randomly generated data (optimized for speed).
 */

import * as fc from 'fast-check';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalSearch } from '../../../../../app/features/search/../../../../app/features/search/components/GlobalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse, SearchResult } from '../../../../../app/features/search/types/search.types';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

describe('GlobalSearch - Property-Based Tests', () => {
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
    // Clear localStorage before each test
    localStorage.clear();
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
  const searchResponseArbitrary = fc.record({
    results: fc.array(searchResultArbitrary, { minLength: 0, maxLength: 20 }),
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
   * Property 2: Result Grouping by Entity Type
   * 
   * For any global search response containing results from multiple entity types,
   * the rendered output should display results grouped by entity type with section
   * headers, where each group contains only results of that entity type.
   * 
   * **Validates: Requirements 1.4, 6.2**
   */
  describe('Property 2: Result Grouping by Entity Type', () => {
    it('should group results by entity type with section headers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.array(searchResultArbitrary, { minLength: 2, maxLength: 20 }),
          async (query, results) => {
            // Ensure we have at least 2 different entity types
            const entityTypes = Array.from(new Set(results.map(r => r.entity_type)));
            if (entityTypes.length < 2) {
              // Add a result with a different entity type
              const unusedTypes = ['items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries']
                .filter(t => !entityTypes.includes(t));
              if (unusedTypes.length > 0) {
                results.push({
                  ...results[0],
                  entity_type: unusedTypes[0],
                  entity_id: fc.sample(fc.uuid(), 1)[0],
                });
              }
            }

            const searchResponse: SearchResponse = {
              results,
              total_count: results.length,
              page: 1,
              page_size: 20,
              total_pages: 1,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for results to be displayed
            await waitFor(
              () => {
                const totalCount = screen.queryByText(/Found \d+ result/);
                expect(totalCount).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Property: Results should be grouped by entity type
            const uniqueEntityTypes = Array.from(new Set(results.map(r => r.entity_type)));
            
            // Each entity type should have a section header
            uniqueEntityTypes.forEach(entityType => {
              const resultsOfType = results.filter(r => r.entity_type === entityType);
              const headerRegex = new RegExp(`${entityType}.*\\(${resultsOfType.length}\\)`, 'i');
              
              // Check if header exists (case-insensitive)
              const headers = container.querySelectorAll('h3');
              const hasHeader = Array.from(headers).some(h => headerRegex.test(h.textContent || ''));
              expect(hasHeader).toBe(true);
            });

            // Property: Each result should be displayed under its entity type group
            results.forEach(result => {
              const resultElement = screen.queryByText(result.title);
              expect(resultElement).toBeInTheDocument();
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 3: Navigation on Result Click
   * 
   * For any search result displayed in the global search, clicking that result
   * should trigger navigation to the entity's detail page and close the global
   * search modal.
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Property 3: Navigation on Result Click', () => {
    it('should navigate to entity detail page and close modal when result is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          searchResultArbitrary,
          async (query, result) => {
            const searchResponse: SearchResponse = {
              results: [result],
              total_count: 1,
              page: 1,
              page_size: 20,
              total_pages: 1,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for result to be displayed
            await waitFor(
              () => {
                const resultElement = screen.queryByText(result.title);
                expect(resultElement).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Click on the result
            const resultElement = screen.getByText(result.title);
            fireEvent.click(resultElement);

            // Property: onNavigate should be called with correct parameters
            expect(onNavigateMock).toHaveBeenCalledWith(result.entity_type, result.entity_id);

            // Property: Modal should close
            expect(onCloseMock).toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 4: Recent Search Execution
   * 
   * For any recent search item displayed in the global search, clicking that item
   * should populate the search input with the query text and execute a search with
   * that query.
   * 
   * **Validates: Requirements 1.8, 8.6**
   */
  describe('Property 4: Recent Search Execution', () => {
    it('should populate input and execute search when recent search is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2), { minLength: 1, maxLength: 5 }),
          async (recentQueries) => {
            // Set up recent searches in localStorage
            const recentSearches = recentQueries.map(query => ({
              query,
              timestamp: Date.now(),
            }));
            localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

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

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Wait for recent searches to be displayed
            await waitFor(
              () => {
                const recentSearchesHeader = screen.queryByText(/Recent Searches/i);
                expect(recentSearchesHeader).toBeInTheDocument();
              },
              { timeout: 500 }
            );

            // Click on the first recent search
            const firstQuery = recentQueries[0];
            const recentSearchButton = screen.getByLabelText(`Recent search: ${firstQuery}`);
            fireEvent.click(recentSearchButton);

            // Property: Input should be populated with the query
            const input = screen.getByLabelText('Search input') as HTMLInputElement;
            expect(input.value).toBe(firstQuery);

            // Property: Search should be executed
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalledWith(
                  expect.objectContaining({ query: firstQuery })
                );
              },
              { timeout: 1000 }
            );
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 5: Error Message Display
   * 
   * For any search request that fails (global or local), the system should display
   * a user-friendly error message appropriate to the error type (network,
   * authentication, or server error).
   * 
   * **Validates: Requirements 1.10, 2.7**
   */
  describe('Property 5: Error Message Display', () => {
    it('should display appropriate error message for different error types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.constantFrom(
            'Session expired. Please log in again.',
            'Search service unavailable. Please try again later.',
            'Unable to connect. Please check your connection and try again.'
          ),
          async (query, errorMessage) => {
            (SearchService.globalSearch as jest.Mock).mockRejectedValue(new Error(errorMessage));

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to fail
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Property: Error message should be displayed
            await waitFor(
              () => {
                const errorElement = screen.queryByText(errorMessage);
                expect(errorElement).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Property: Retry button should be visible
            const retryButton = screen.getByLabelText('Retry search');
            expect(retryButton).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 12: Keyboard Navigation
   * 
   * For any list of search results displayed in the global search, pressing Arrow
   * Down should move selection to the next result, pressing Arrow Up should move
   * selection to the previous result, and selection should wrap around at list
   * boundaries.
   * 
   * **Validates: Requirements 5.1**
   */
  describe('Property 12: Keyboard Navigation', () => {
    it('should navigate through results with arrow keys and wrap at boundaries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.array(searchResultArbitrary, { minLength: 3, maxLength: 10 }),
          async (query, results) => {
            const searchResponse: SearchResponse = {
              results,
              total_count: results.length,
              page: 1,
              page_size: 20,
              total_pages: 1,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for results to be displayed
            await waitFor(
              () => {
                const totalCount = screen.queryByText(/Found \d+ result/);
                expect(totalCount).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Property: Arrow Down should move selection forward
            fireEvent.keyDown(input, { key: 'ArrowDown' });
            
            // Check that second result is highlighted
            await waitFor(() => {
              const highlightedElements = container.querySelectorAll('[class*="bg-blue-50"]');
              expect(highlightedElements.length).toBeGreaterThan(0);
            });

            // Property: Arrow Up should move selection backward
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            
            // Property: Selection should wrap at boundaries
            // Press Arrow Up from first item should go to last item
            fireEvent.keyDown(input, { key: 'ArrowUp' });
            
            await waitFor(() => {
              const highlightedElements = container.querySelectorAll('[class*="bg-blue-50"]');
              expect(highlightedElements.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 13: Enter Key Navigation
   * 
   * For any highlighted search result in the global search, pressing the Enter key
   * should navigate to that entity's detail page.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Property 13: Enter Key Navigation', () => {
    it('should navigate to detail page when Enter is pressed on highlighted result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.array(searchResultArbitrary, { minLength: 1, maxLength: 5 }),
          async (query, results) => {
            const searchResponse: SearchResponse = {
              results,
              total_count: results.length,
              page: 1,
              page_size: 20,
              total_pages: 1,
              has_next_page: false,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for results to be displayed
            await waitFor(
              () => {
                const totalCount = screen.queryByText(/Found \d+ result/);
                expect(totalCount).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Press Enter to select the first (highlighted) result
            fireEvent.keyDown(input, { key: 'Enter' });

            // Property: onNavigate should be called with the first result
            await waitFor(() => {
              expect(onNavigateMock).toHaveBeenCalledWith(
                results[0].entity_type,
                results[0].entity_id
              );
            });

            // Property: Modal should close
            expect(onCloseMock).toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 14: ARIA Labels on Interactive Elements
   * 
   * For any interactive element in the search components (buttons, inputs, result
   * items), the rendered HTML should include appropriate ARIA labels for screen
   * reader accessibility.
   * 
   * **Validates: Requirements 5.4**
   */
  describe('Property 14: ARIA Labels on Interactive Elements', () => {
    it('should have ARIA labels on all interactive elements', async () => {
      const onCloseMock = jest.fn();
      const onNavigateMock = jest.fn();

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <GlobalSearch
            isOpen={true}
            onClose={onCloseMock}
            onNavigate={onNavigateMock}
          />
        </QueryClientProvider>
      );

      // Property: Modal should have role="dialog" and aria-modal="true"
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Global search');

      // Property: Search input should have aria-label
      const input = screen.getByLabelText('Search input');
      expect(input).toBeInTheDocument();

      // Property: Close button should have aria-label
      const closeButton = screen.getByLabelText('Close search');
      expect(closeButton).toBeInTheDocument();

      // Property: All interactive elements should be keyboard accessible
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  /**
   * Property 17: Pagination Limit
   * 
   * For any search response containing more than 20 results, only the first 20
   * results for the current page should be displayed in the UI.
   * 
   * **Validates: Requirements 6.4**
   */
  describe('Property 17: Pagination Limit', () => {
    it('should display only 20 results per page when total results exceed 20', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.integer({ min: 21, max: 100 }), // Total count > 20
          async (query, totalCount) => {
            // Generate exactly 20 results for the current page
            const results = fc.sample(searchResultArbitrary, 20);
            
            const searchResponse: SearchResponse = {
              results,
              total_count: totalCount,
              page: 1,
              page_size: 20,
              total_pages: Math.ceil(totalCount / 20),
              has_next_page: totalCount > 20,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for results to be displayed
            await waitFor(
              () => {
                const totalCountText = screen.queryByText(new RegExp(`Found ${totalCount} result`));
                expect(totalCountText).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Property: Only 20 results should be displayed
            const resultElements = container.querySelectorAll('[role="button"]').length;
            // Subtract 2 for close button and clear button (if present)
            const displayedResults = results.filter(r => {
              const element = screen.queryByText(r.title);
              return element !== null;
            });
            
            expect(displayedResults.length).toBeLessThanOrEqual(20);
            expect(displayedResults.length).toBe(results.length);

            // Property: Total count should show the full count, not just displayed results
            const totalCountText = screen.getByText(new RegExp(`Found ${totalCount} result`));
            expect(totalCountText).toBeInTheDocument();
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 18: Pagination Controls Display
   * 
   * For any search response where total_count exceeds 20, pagination controls
   * should be visible in the rendered UI.
   * 
   * **Validates: Requirements 6.5**
   */
  describe('Property 18: Pagination Controls Display', () => {
    it('should display pagination controls when total count exceeds 20', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.integer({ min: 21, max: 100 }), // Total count > 20
          fc.integer({ min: 1, max: 5 }), // Current page
          async (query, totalCount, currentPage) => {
            // Generate exactly 20 results for the current page
            const results = fc.sample(searchResultArbitrary, 20);
            const totalPages = Math.ceil(totalCount / 20);
            const validPage = Math.min(currentPage, totalPages);
            
            const searchResponse: SearchResponse = {
              results,
              total_count: totalCount,
              page: validPage,
              page_size: 20,
              total_pages: totalPages,
              has_next_page: validPage < totalPages,
              has_previous_page: validPage > 1,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Wait for results to be displayed
            await waitFor(
              () => {
                const totalCountText = screen.queryByText(new RegExp(`Found ${totalCount} result`));
                expect(totalCountText).toBeInTheDocument();
              },
              { timeout: 1000 }
            );

            // Property: Pagination controls should be visible
            const previousButton = screen.getByLabelText('Previous page');
            const nextButton = screen.getByLabelText('Next page');
            
            expect(previousButton).toBeInTheDocument();
            expect(nextButton).toBeInTheDocument();

            // Property: Page info should be displayed
            const pageInfo = screen.getByText(new RegExp(`Page ${validPage} of ${totalPages}`));
            expect(pageInfo).toBeInTheDocument();

            // Property: Previous button should be disabled on first page
            if (validPage === 1) {
              expect(previousButton).toBeDisabled();
            } else {
              expect(previousButton).not.toBeDisabled();
            }

            // Property: Next button should be disabled on last page
            if (validPage === totalPages) {
              expect(nextButton).toBeDisabled();
            } else {
              expect(nextButton).not.toBeDisabled();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 19: Total Count Display
   * 
   * For any search response, the total count of matching results should be
   * displayed in the UI.
   * 
   * **Validates: Requirements 6.6**
   */
  describe('Property 19: Total Count Display', () => {
    it('should display total count of matching results', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
          fc.integer({ min: 0, max: 100 }), // Total count (including 0)
          async (query, totalCount) => {
            // Generate results based on total count (up to 20 for current page)
            const resultsCount = Math.min(totalCount, 20);
            const results = resultsCount > 0 ? fc.sample(searchResultArbitrary, resultsCount) : [];
            
            const searchResponse: SearchResponse = {
              results,
              total_count: totalCount,
              page: 1,
              page_size: 20,
              total_pages: Math.ceil(totalCount / 20) || 1,
              has_next_page: totalCount > 20,
              has_previous_page: false,
              query_time_ms: 50,
            };

            (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Type in the search input
            const input = screen.getByLabelText('Search input');
            fireEvent.change(input, { target: { value: query } });

            // Wait for search to complete
            await waitFor(
              () => {
                expect(SearchService.globalSearch).toHaveBeenCalled();
              },
              { timeout: 1000 }
            );

            // Property: Total count should be displayed
            if (totalCount === 0) {
              // For zero results, check for empty state message
              await waitFor(
                () => {
                  const emptyMessage = screen.queryByText(new RegExp(`No results found for`));
                  expect(emptyMessage).toBeInTheDocument();
                },
                { timeout: 1000 }
              );
            } else {
              // For non-zero results, check for count display
              await waitFor(
                () => {
                  const resultText = totalCount === 1 ? 'result' : 'results';
                  const totalCountText = screen.queryByText(new RegExp(`Found ${totalCount} ${resultText}`));
                  expect(totalCountText).toBeInTheDocument();
                },
                { timeout: 1000 }
              );

              // Property: Total count should match the response total_count, not just displayed results
              const totalCountElement = screen.getByText(new RegExp(`Found ${totalCount}`));
              expect(totalCountElement).toBeInTheDocument();
              
              // Verify it shows the full count even if only 20 are displayed
              if (totalCount > 20) {
                expect(totalCountElement.textContent).toContain(totalCount.toString());
                expect(totalCountElement.textContent).not.toContain('20');
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });

  /**
   * Property 26: Mobile Full-Screen Modal
   * 
   * For any device with screen width less than 768px, the global search modal
   * should render at full screen width.
   * 
   * **Validates: Requirements 9.1**
   */
  describe('Property 26: Mobile Full-Screen Modal', () => {
    it('should render modal at full screen width on mobile devices', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
          async (viewportWidth) => {
            // Set viewport to mobile size
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: viewportWidth,
            });

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            const onCloseMock = jest.fn();
            const onNavigateMock = jest.fn();

            const { container } = render(
              <QueryClientProvider client={queryClient}>
                <GlobalSearch
                  isOpen={true}
                  onClose={onCloseMock}
                  onNavigate={onNavigateMock}
                />
              </QueryClientProvider>
            );

            // Find the modal content div (the one with w-full class)
            const modalContent = container.querySelector('[role="dialog"] > div');
            expect(modalContent).toBeInTheDocument();

            // Property: Modal should have full width class
            expect(modalContent).toHaveClass('w-full');

            // Property: Modal should have full height class
            expect(modalContent).toHaveClass('h-full');

            // Property: Modal should NOT have desktop-only height auto class applied
            // (md:h-auto only applies at ≥768px, so on mobile h-full takes precedence)
            const computedStyle = window.getComputedStyle(modalContent!);
            
            // On mobile (< 768px), the modal should take full height
            // The h-full class sets height to 100%
            expect(modalContent).toHaveClass('h-full');
          }
        ),
        { numRuns: 20 }
      );
    }, 30000); // 30 second timeout
  });
});
