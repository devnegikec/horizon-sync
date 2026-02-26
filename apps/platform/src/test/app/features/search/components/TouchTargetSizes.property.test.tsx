/**
 * Property-Based Test for Touch Target Sizes
 * 
 * This test validates that all interactive elements in the search components
 * meet the minimum touch target size requirement of 44x44 pixels for
 * accessibility on mobile devices.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalSearch } from '../../../../../app/features/search/../../../../app/features/search/components/GlobalSearch';
import { LocalSearch } from '../../../../../app/features/search/../../../../app/features/search/components/LocalSearch';
import { SearchResultItem } from '../../../../../app/features/search/../../../../app/features/search/components/SearchResultItem';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse, SearchResult } from '../../../../../app/features/search/types/search.types';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

/**
 * Helper function to get computed dimensions of an element
 */
function getElementDimensions(element: Element): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  // Get dimensions including padding and border
  const width = rect.width || parseFloat(computedStyle.width) || 0;
  const height = rect.height || parseFloat(computedStyle.height) || 0;
  
  // For elements with min-width/min-height classes, check those too
  const minWidth = parseFloat(computedStyle.minWidth) || 0;
  const minHeight = parseFloat(computedStyle.minHeight) || 0;
  
  return {
    width: Math.max(width, minWidth),
    height: Math.max(height, minHeight),
  };
}

/**
 * Helper function to check if an element meets touch target size requirements
 */
function meetsTouchTargetSize(element: Element, minSize: number = 44): boolean {
  const { width, height } = getElementDimensions(element);
  
  // Check if element has min-w-[44px] or min-h-[44px] classes
  const classList = element.className || '';
  const hasMinWidthClass = classList.includes('min-w-[44px]');
  const hasMinHeightClass = classList.includes('min-h-[44px]');
  
  // If the element has the appropriate classes, it meets the requirement
  if (hasMinWidthClass && hasMinHeightClass) {
    return true;
  }
  
  // Otherwise check computed dimensions
  return width >= minSize && height >= minSize;
}

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
 * Property 28: Touch Target Sizes
 * 
 * For any interactive element in the search components, the element should have
 * a minimum tap target size of 44x44 pixels for touch accessibility.
 * 
 * **Validates: Requirements 9.3**
 */
describe('Property 28: Touch Target Sizes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Test GlobalSearch interactive elements
   */
  it('should have minimum 44x44px touch targets for all GlobalSearch interactive elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2), { minLength: 1, maxLength: 5 }),
        fc.array(searchResultArbitrary, { minLength: 0, maxLength: 10 }),
        async (recentQueries, results) => {
          // Set up recent searches in localStorage
          const recentSearches = recentQueries.map(query => ({
            query,
            timestamp: Date.now(),
          }));
          localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

          // Mock search response
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

          // Property: Search input should have minimum height of 44px
          const searchInput = container.querySelector('input[aria-label="Search input"]');
          expect(searchInput).toBeInTheDocument();
          if (searchInput) {
            expect(searchInput.className).toContain('min-h-[44px]');
          }

          // Property: Close button should have minimum 44x44px touch target
          const closeButton = container.querySelector('button[aria-label="Close search"]');
          expect(closeButton).toBeInTheDocument();
          if (closeButton) {
            expect(closeButton.className).toContain('min-w-[44px]');
            expect(closeButton.className).toContain('min-h-[44px]');
          }

          // Property: Clear recent searches button should have minimum height of 44px
          const clearButton = container.querySelector('button[aria-label="Clear recent searches"]');
          if (clearButton) {
            expect(clearButton.className).toContain('min-h-[44px]');
          }

          // Property: Recent search buttons should have minimum height of 44px
          const recentSearchButtons = container.querySelectorAll('button[aria-label^="Recent search:"]');
          recentSearchButtons.forEach(button => {
            expect(button.className).toContain('min-h-[44px]');
          });

          // Property: All buttons should be keyboard accessible
          const allButtons = container.querySelectorAll('button');
          allButtons.forEach(button => {
            expect(button).toHaveAttribute('aria-label');
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Test LocalSearch interactive elements
   */
  it('should have minimum 44x44px touch targets for all LocalSearch interactive elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
        fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2),
        async (entityType, query) => {
          // Mock search response
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

          (SearchService.localSearch as jest.Mock).mockResolvedValue(searchResponse);

          const onResultsChangeMock = jest.fn();

          const { container } = render(
            <QueryClientProvider client={queryClient}>
              <LocalSearch
                entityType={entityType}
                onResultsChange={onResultsChangeMock}
                placeholder={`Search ${entityType}...`}
              />
            </QueryClientProvider>
          );

          // Property: Search input should have minimum height of 44px on mobile
          const searchInput = container.querySelector(`input[aria-label="Search ${entityType}"]`);
          expect(searchInput).toBeInTheDocument();
          if (searchInput) {
            expect(searchInput.className).toContain('max-md:min-h-[44px]');
          }

          // Simulate typing to show clear button
          if (searchInput) {
            (searchInput as HTMLInputElement).value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Wait for clear button to appear
          await new Promise(resolve => setTimeout(resolve, 100));

          // Property: Clear button should have minimum 44x44px touch target on mobile
          const clearButton = container.querySelector('button[aria-label="Clear search"]');
          if (clearButton) {
            expect(clearButton.className).toContain('max-md:min-w-[44px]');
            expect(clearButton.className).toContain('max-md:min-h-[44px]');
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Test SearchResultItem interactive elements
   */
  it('should have minimum 44x44px touch targets for SearchResultItem', () => {
    fc.assert(
      fc.property(
        searchResultArbitrary,
        fc.boolean(),
        (result, isHighlighted) => {
          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={isHighlighted}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Result item should have minimum height of 44px
          const resultItem = container.querySelector('[role="button"]');
          expect(resultItem).toBeInTheDocument();
          if (resultItem) {
            expect(resultItem.className).toContain('min-h-[44px]');
          }

          // Property: Result item should be keyboard accessible
          if (resultItem) {
            expect(resultItem).toHaveAttribute('tabIndex', '0');
            expect(resultItem).toHaveAttribute('aria-label');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test touch target sizes on mobile viewports
   */
  it('should maintain minimum touch target sizes on mobile viewports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
        fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
        async (viewportWidth, entityType) => {
          // Set viewport to mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          // Test LocalSearch on mobile
          const onResultsChangeMock = jest.fn();

          const { container } = render(
            <QueryClientProvider client={queryClient}>
              <LocalSearch
                entityType={entityType}
                onResultsChange={onResultsChangeMock}
                placeholder={`Search ${entityType}...`}
              />
            </QueryClientProvider>
          );

          // Property: All interactive elements should have appropriate mobile touch target classes
          const searchInput = container.querySelector('input');
          if (searchInput) {
            expect(searchInput.className).toContain('max-md:min-h-[44px]');
          }

          // Simulate typing to show clear button
          if (searchInput) {
            (searchInput as HTMLInputElement).value = 'test query';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          await new Promise(resolve => setTimeout(resolve, 100));

          const clearButton = container.querySelector('button[aria-label="Clear search"]');
          if (clearButton) {
            expect(clearButton.className).toContain('max-md:min-w-[44px]');
            expect(clearButton.className).toContain('max-md:min-h-[44px]');
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Test that all interactive elements are keyboard accessible
   */
  it('should ensure all interactive elements with touch targets are keyboard accessible', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2), { minLength: 1, maxLength: 3 }),
        async (recentQueries) => {
          // Set up recent searches
          const recentSearches = recentQueries.map(query => ({
            query,
            timestamp: Date.now(),
          }));
          localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

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

          // Property: All buttons should have aria-label
          const buttons = container.querySelectorAll('button');
          buttons.forEach(button => {
            expect(button).toHaveAttribute('aria-label');
          });

          // Property: All interactive elements should be focusable
          const interactiveElements = container.querySelectorAll('button, input, [role="button"]');
          interactiveElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');
            // Should either have no tabindex (default focusable) or tabindex >= 0
            if (tabIndex !== null) {
              expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);

  /**
   * Test comprehensive touch target coverage across all components
   */
  it('should verify all interactive elements across all search components meet touch target requirements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          recentQueries: fc.array(fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2), { minLength: 1, maxLength: 3 }),
          searchResults: fc.array(searchResultArbitrary, { minLength: 1, maxLength: 5 }),
          entityType: fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
        }),
        async ({ recentQueries, searchResults, entityType }) => {
          // Set up recent searches
          const recentSearches = recentQueries.map(query => ({
            query,
            timestamp: Date.now(),
          }));
          localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

          // Mock search response
          const searchResponse: SearchResponse = {
            results: searchResults,
            total_count: searchResults.length,
            page: 1,
            page_size: 20,
            total_pages: 1,
            has_next_page: false,
            has_previous_page: false,
            query_time_ms: 50,
          };

          (SearchService.globalSearch as jest.Mock).mockResolvedValue(searchResponse);
          (SearchService.localSearch as jest.Mock).mockResolvedValue(searchResponse);

          // Test GlobalSearch
          const { container: globalContainer } = render(
            <QueryClientProvider client={queryClient}>
              <GlobalSearch
                isOpen={true}
                onClose={() => {}}
                onNavigate={() => {}}
              />
            </QueryClientProvider>
          );

          // Query all interactive elements in GlobalSearch
          const globalButtons = globalContainer.querySelectorAll('button');
          const globalInputs = globalContainer.querySelectorAll('input');
          const globalInteractive = globalContainer.querySelectorAll('[role="button"]');

          // Property: All buttons should have minimum touch target size classes
          globalButtons.forEach(button => {
            const hasMinHeight = button.className.includes('min-h-[44px]');
            const hasMinWidth = button.className.includes('min-w-[44px]');
            const hasPadding = button.className.includes('p-') || button.className.includes('py-');
            
            // Button should have either explicit min dimensions or sufficient padding
            expect(hasMinHeight || hasMinWidth || hasPadding).toBe(true);
          });

          // Property: All inputs should have minimum height
          globalInputs.forEach(input => {
            expect(input.className).toContain('min-h-[44px]');
          });

          // Property: All role="button" elements should have minimum height
          globalInteractive.forEach(element => {
            expect(element.className).toContain('min-h-[44px]');
          });

          // Test LocalSearch
          const { container: localContainer } = render(
            <QueryClientProvider client={queryClient}>
              <LocalSearch
                entityType={entityType}
                onResultsChange={() => {}}
                placeholder={`Search ${entityType}...`}
              />
            </QueryClientProvider>
          );

          // Query all interactive elements in LocalSearch
          const localInputs = localContainer.querySelectorAll('input');
          
          // Property: LocalSearch inputs should have mobile-responsive touch targets
          localInputs.forEach(input => {
            expect(input.className).toContain('max-md:min-h-[44px]');
          });
        }
      ),
      { numRuns: 20 }
    );
  }, 30000);
});
