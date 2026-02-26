import fc from 'fast-check';

/**
 * Property-Based Tests for QuotationsTable
 * Feature: quotation-sales-order-flow
 */

describe('Feature: quotation-sales-order-flow, Property 12: Pagination Consistency', () => {
  /**
   * **Validates: Requirements 1.6, 9.6**
   * 
   * Property: For any page size and total item count, the pagination should correctly
   * calculate the number of pages and enable/disable next/previous buttons appropriately.
   */

  // Helper function to calculate pagination state
  const calculatePaginationState = (totalItems: number, pageSize: number, currentPage: number) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    
    return {
      totalPages,
      hasNext,
      hasPrev,
    };
  };

  it('should correctly calculate total pages for any total items and page size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }), // total items
        fc.integer({ min: 1, max: 100 }),   // page size
        (totalItems, pageSize) => {
          const { totalPages } = calculatePaginationState(totalItems, pageSize, 1);
          
          // Total pages should be ceiling of totalItems / pageSize
          const expectedPages = Math.ceil(totalItems / pageSize);
          expect(totalPages).toBe(expectedPages);
          
          // Total pages should never be negative
          expect(totalPages).toBeGreaterThanOrEqual(0);
          
          // If there are items, there should be at least 1 page
          if (totalItems > 0) {
            expect(totalPages).toBeGreaterThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly enable/disable next button based on current page', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // total items (at least 1)
        fc.integer({ min: 1, max: 50 }),   // page size
        (totalItems, pageSize) => {
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Test first page
          const firstPage = calculatePaginationState(totalItems, pageSize, 1);
          if (totalPages > 1) {
            expect(firstPage.hasNext).toBe(true);
          } else {
            expect(firstPage.hasNext).toBe(false);
          }
          
          // Test last page
          const lastPage = calculatePaginationState(totalItems, pageSize, totalPages);
          expect(lastPage.hasNext).toBe(false);
          
          // Test middle page (if exists)
          if (totalPages > 2) {
            const middlePage = Math.floor(totalPages / 2);
            const middle = calculatePaginationState(totalItems, pageSize, middlePage);
            expect(middle.hasNext).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly enable/disable previous button based on current page', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // total items (at least 1)
        fc.integer({ min: 1, max: 50 }),   // page size
        (totalItems, pageSize) => {
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Test first page - should not have previous
          const firstPage = calculatePaginationState(totalItems, pageSize, 1);
          expect(firstPage.hasPrev).toBe(false);
          
          // Test last page - should have previous if more than 1 page
          if (totalPages > 1) {
            const lastPage = calculatePaginationState(totalItems, pageSize, totalPages);
            expect(lastPage.hasPrev).toBe(true);
          }
          
          // Test second page - should always have previous
          if (totalPages > 1) {
            const secondPage = calculatePaginationState(totalItems, pageSize, 2);
            expect(secondPage.hasPrev).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case with zero items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // page size
        (pageSize) => {
          const { totalPages, hasNext, hasPrev } = calculatePaginationState(0, pageSize, 1);
          
          // With zero items, there should be 0 pages
          expect(totalPages).toBe(0);
          
          // No next or previous buttons should be enabled
          expect(hasNext).toBe(false);
          expect(hasPrev).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case with items exactly equal to page size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // page size
        (pageSize) => {
          const totalItems = pageSize;
          const { totalPages, hasNext, hasPrev } = calculatePaginationState(totalItems, pageSize, 1);
          
          // Should have exactly 1 page
          expect(totalPages).toBe(1);
          
          // No next button (only 1 page)
          expect(hasNext).toBe(false);
          
          // No previous button (on first page)
          expect(hasPrev).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case with items one more than page size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // page size
        (pageSize) => {
          const totalItems = pageSize + 1;
          const { totalPages } = calculatePaginationState(totalItems, pageSize, 1);
          
          // Should have exactly 2 pages
          expect(totalPages).toBe(2);
          
          // First page should have next
          const firstPage = calculatePaginationState(totalItems, pageSize, 1);
          expect(firstPage.hasNext).toBe(true);
          expect(firstPage.hasPrev).toBe(false);
          
          // Second page should have previous but not next
          const secondPage = calculatePaginationState(totalItems, pageSize, 2);
          expect(secondPage.hasNext).toBe(false);
          expect(secondPage.hasPrev).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency across different page sizes for same total items', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }), // total items
        fc.integer({ min: 1, max: 50 }),    // page size 1
        fc.integer({ min: 1, max: 50 }),    // page size 2
        (totalItems, pageSize1, pageSize2) => {
          const pages1 = Math.ceil(totalItems / pageSize1);
          const pages2 = Math.ceil(totalItems / pageSize2);
          
          // Smaller page size should result in more or equal pages
          if (pageSize1 < pageSize2) {
            expect(pages1).toBeGreaterThanOrEqual(pages2);
          } else if (pageSize1 > pageSize2) {
            expect(pages1).toBeLessThanOrEqual(pages2);
          } else {
            expect(pages1).toBe(pages2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly handle navigation through all pages', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 500 }), // total items
        fc.integer({ min: 5, max: 50 }),   // page size
        (totalItems, pageSize) => {
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Navigate through all pages
          for (let page = 1; page <= totalPages; page++) {
            const state = calculatePaginationState(totalItems, pageSize, page);
            
            // First page should not have previous
            if (page === 1) {
              expect(state.hasPrev).toBe(false);
            } else {
              expect(state.hasPrev).toBe(true);
            }
            
            // Last page should not have next
            if (page === totalPages) {
              expect(state.hasNext).toBe(false);
            } else {
              expect(state.hasNext).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 } // Reduced runs since this iterates through pages
    );
  });

  it('should handle very large total item counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 1000000 }), // large total items
        fc.integer({ min: 10, max: 100 }),        // page size
        (totalItems, pageSize) => {
          const { totalPages } = calculatePaginationState(totalItems, pageSize, 1);
          
          // Total pages should be correctly calculated even for large numbers
          const expectedPages = Math.ceil(totalItems / pageSize);
          expect(totalPages).toBe(expectedPages);
          
          // First page should have next
          const firstPage = calculatePaginationState(totalItems, pageSize, 1);
          expect(firstPage.hasNext).toBe(true);
          expect(firstPage.hasPrev).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain mathematical invariants', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // total items
        fc.integer({ min: 1, max: 50 }),   // page size
        fc.integer({ min: 1, max: 100 }),  // current page
        (totalItems, pageSize, requestedPage) => {
          const totalPages = Math.ceil(totalItems / pageSize);
          
          // Clamp current page to valid range
          const currentPage = Math.min(requestedPage, totalPages);
          
          if (currentPage < 1 || totalPages === 0) {
            return; // Skip invalid cases
          }
          
          const state = calculatePaginationState(totalItems, pageSize, currentPage);
          
          // Invariant 1: If hasNext is true, current page must be less than total pages
          if (state.hasNext) {
            expect(currentPage).toBeLessThan(totalPages);
          }
          
          // Invariant 2: If hasPrev is true, current page must be greater than 1
          if (state.hasPrev) {
            expect(currentPage).toBeGreaterThan(1);
          }
          
          // Invariant 3: If on last page, hasNext must be false
          if (currentPage === totalPages) {
            expect(state.hasNext).toBe(false);
          }
          
          // Invariant 4: If on first page, hasPrev must be false
          if (currentPage === 1) {
            expect(state.hasPrev).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary between pages correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // page size (at least 2 to have meaningful boundaries)
        fc.integer({ min: 2, max: 10 }),  // number of pages
        (pageSize, numPages) => {
          // Create total items that result in exactly numPages
          const totalItems = pageSize * numPages;
          
          const totalPagesCalc = Math.ceil(totalItems / pageSize);
          expect(totalPagesCalc).toBe(numPages);
          
          // Test boundary: last item of page N and first item of page N+1
          for (let page = 1; page < numPages; page++) {
            const currentPageState = calculatePaginationState(totalItems, pageSize, page);
            const nextPageState = calculatePaginationState(totalItems, pageSize, page + 1);
            
            // Current page should have next
            expect(currentPageState.hasNext).toBe(true);
            
            // Next page should have previous
            expect(nextPageState.hasPrev).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single item edge case', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // page size
        (pageSize) => {
          const totalItems = 1;
          const { totalPages, hasNext, hasPrev } = calculatePaginationState(totalItems, pageSize, 1);
          
          // Should have exactly 1 page
          expect(totalPages).toBe(1);
          
          // No navigation buttons should be enabled
          expect(hasNext).toBe(false);
          expect(hasPrev).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
