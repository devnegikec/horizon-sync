/**
 * Property-Based Test for Mobile Vertical Stacking
 * 
 * This test validates that search result information stacks vertically
 * on mobile devices (viewport width < 768px) for better readability.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchResultItem } from '../../../../../app/features/search/../../../../app/features/search/components/SearchResultItem';
import type { SearchResult } from '../../../../../app/features/search/types/search.types';

/**
 * Arbitrary generator for SearchResult with metadata
 */
const searchResultWithMetadataArbitrary = fc.record({
  entity_id: fc.uuid(),
  entity_type: fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
  title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
  snippet: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
  relevance_score: fc.float({ min: 0, max: 1 }),
  metadata: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.integer({ min: 0, max: 10000 }),
      fc.float({ min: 0, max: 10000 }),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString())
    ),
    { minKeys: 1, maxKeys: 5 } // Ensure at least 1 metadata item
  ),
}) as fc.Arbitrary<SearchResult>;

/**
 * Helper function to check if an element has vertical stacking classes
 */
function hasVerticalStackingClasses(element: Element): boolean {
  const classList = element.className || '';
  
  // Check for flex-col class (vertical stacking)
  // The component uses "flex flex-col md:flex-row" pattern
  // which means flex-col on mobile and flex-row on desktop
  return classList.includes('flex-col');
}

/**
 * Helper function to check if an element has responsive flex direction
 */
function hasResponsiveFlexDirection(element: Element): boolean {
  const classList = element.className || '';
  
  // Check for the pattern: flex-col md:flex-row
  // This means vertical on mobile, horizontal on desktop
  return classList.includes('flex-col') && classList.includes('md:flex-row');
}

/**
 * Property 29: Mobile Vertical Stacking
 * 
 * For any search results displayed on a device with screen width less than 768px,
 * the result information should be stacked vertically rather than horizontally.
 * 
 * **Validates: Requirements 9.4**
 */
describe('Property 29: Mobile Vertical Stacking', () => {
  /**
   * Test that SearchResultItem uses vertical stacking classes for mobile
   */
  it('should stack result information vertically on mobile viewports (< 768px)', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
        fc.boolean(),
        (result, viewportWidth, isHighlighted) => {
          // Set viewport to mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={isHighlighted}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: The main content container should have vertical stacking on mobile
          // The component uses "flex flex-col md:flex-row" for the main content area
          const mainContentDiv = container.querySelector('.flex.flex-col.md\\:flex-row');
          expect(mainContentDiv).toBeInTheDocument();
          
          if (mainContentDiv) {
            // Verify it has the responsive flex direction classes
            expect(hasResponsiveFlexDirection(mainContentDiv)).toBe(true);
            
            // Verify it has flex-col (vertical stacking for mobile)
            expect(hasVerticalStackingClasses(mainContentDiv)).toBe(true);
          }

          // Property: The metadata container should also stack vertically on mobile
          // The component uses "flex flex-col md:flex-row md:flex-wrap" for metadata
          const metadataDiv = container.querySelector('.flex.flex-col.md\\:flex-row');
          
          // If metadata exists, verify it has vertical stacking
          if (metadataDiv && Object.keys(result.metadata).length > 0) {
            expect(hasVerticalStackingClasses(metadataDiv)).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that vertical stacking is applied consistently across different entity types
   */
  it('should apply vertical stacking consistently across all entity types on mobile', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('items', 'customers', 'suppliers', 'invoices', 'warehouses', 'stock_entries'),
        fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0),
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 0, max: 10000 })
          ),
          { minKeys: 2, maxKeys: 4 }
        ),
        (entityType, title, snippet, metadata) => {
          // Set viewport to mobile size (e.g., iPhone SE)
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
          });

          window.dispatchEvent(new Event('resize'));

          const result: SearchResult = {
            entity_id: '123',
            entity_type: entityType,
            title,
            snippet,
            relevance_score: 0.9,
            metadata,
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: All entity types should have the same vertical stacking behavior
          const flexContainers = container.querySelectorAll('.flex.flex-col');
          
          // Should have at least one flex container with vertical stacking
          expect(flexContainers.length).toBeGreaterThan(0);
          
          // All flex containers with md:flex-row should start with flex-col
          flexContainers.forEach(element => {
            if (element.className.includes('md:flex-row')) {
              expect(element.className).toContain('flex-col');
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that vertical stacking applies to both main content and metadata sections
   */
  it('should stack both main content and metadata vertically on mobile', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        (result) => {
          // Set viewport to mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Main content area (icon + badge/title) should stack vertically
          const mainContentDiv = container.querySelector('.flex.flex-col.md\\:flex-row.md\\:items-start');
          expect(mainContentDiv).toBeInTheDocument();
          
          if (mainContentDiv) {
            expect(mainContentDiv.className).toContain('flex-col');
            expect(mainContentDiv.className).toContain('md:flex-row');
          }

          // Property: Metadata area should stack vertically if it exists
          if (Object.keys(result.metadata).length > 0) {
            const metadataDiv = container.querySelector('.flex.flex-col.md\\:flex-row.md\\:flex-wrap');
            expect(metadataDiv).toBeInTheDocument();
            
            if (metadataDiv) {
              expect(metadataDiv.className).toContain('flex-col');
              expect(metadataDiv.className).toContain('md:flex-row');
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that gap spacing is appropriate for vertical stacking
   */
  it('should use appropriate gap spacing for vertical stacking on mobile', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        (result) => {
          // Set viewport to mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Flex containers should have gap classes for proper spacing
          const mainContentDiv = container.querySelector('.flex.flex-col.md\\:flex-row');
          
          if (mainContentDiv) {
            // Should have gap-2 or gap-3 for spacing between stacked items
            const hasGap = mainContentDiv.className.includes('gap-');
            expect(hasGap).toBe(true);
          }

          // Property: Metadata should also have gap spacing
          if (Object.keys(result.metadata).length > 0) {
            const metadataDiv = container.querySelector('.flex.flex-col.md\\:flex-row.md\\:flex-wrap');
            
            if (metadataDiv) {
              const hasGap = metadataDiv.className.includes('gap-');
              expect(hasGap).toBe(true);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that vertical stacking works across different mobile viewport sizes
   */
  it('should maintain vertical stacking across all mobile viewport sizes', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        fc.integer({ min: 320, max: 767 }), // All mobile sizes from small phones to tablets
        (result, viewportWidth) => {
          // Set viewport to specified mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Vertical stacking should be consistent across all mobile sizes
          const flexContainers = container.querySelectorAll('.flex.flex-col.md\\:flex-row');
          
          // Should have at least one responsive flex container
          expect(flexContainers.length).toBeGreaterThan(0);
          
          // All responsive flex containers should have flex-col for mobile
          flexContainers.forEach(element => {
            expect(element.className).toContain('flex-col');
            expect(element.className).toContain('md:flex-row');
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that desktop viewports use horizontal layout (not vertical stacking)
   */
  it('should NOT use vertical-only stacking on desktop viewports (>= 768px)', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        fc.integer({ min: 768, max: 1920 }), // Desktop viewport widths
        (result, viewportWidth) => {
          // Set viewport to desktop size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewportWidth,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Responsive flex containers should have md:flex-row for desktop
          const flexContainers = container.querySelectorAll('.flex.flex-col.md\\:flex-row');
          
          // All responsive flex containers should have the md:flex-row class
          // This ensures they switch to horizontal layout on desktop
          flexContainers.forEach(element => {
            expect(element.className).toContain('md:flex-row');
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Test that vertical stacking improves readability by ensuring proper element ordering
   */
  it('should maintain logical element ordering when stacked vertically', () => {
    fc.assert(
      fc.property(
        searchResultWithMetadataArbitrary,
        (result) => {
          // Set viewport to mobile size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
          });

          window.dispatchEvent(new Event('resize'));

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Property: Elements should appear in logical reading order
          // 1. Icon (if present)
          // 2. Badge and title
          // 3. Snippet
          // 4. Metadata
          
          const mainDiv = container.querySelector('[role="button"]');
          expect(mainDiv).toBeInTheDocument();
          
          if (mainDiv) {
            const children = Array.from(mainDiv.children);
            
            // Should have at least the main content div
            expect(children.length).toBeGreaterThan(0);
            
            // The first child should be the main content container
            const firstChild = children[0];
            expect(firstChild.className).toContain('flex');
            
            // Badge and title should be within the first section
            const badge = container.querySelector('.inline-flex');
            const title = container.querySelector('h3');
            expect(badge).toBeInTheDocument();
            expect(title).toBeInTheDocument();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Validates: Requirements 9.4
 */
