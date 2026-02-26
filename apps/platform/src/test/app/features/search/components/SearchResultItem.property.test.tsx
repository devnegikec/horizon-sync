/**
 * Property-based tests for SearchResultItem component
 * Tests universal properties across randomized inputs
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { SearchResultItem } from '../../../../../app/features/search/../../../../app/features/search/components/SearchResultItem';
import { SearchResult } from '../../../../../app/features/search/types/search.types';
import { getAllEntityTypes } from '../../../../../app/features/search/constants/entityTypes';

/**
 * Arbitrary generator for SearchResult
 */
const searchResultArbitrary = fc.record({
  entity_id: fc.uuid(),
  entity_type: fc.constantFrom(...getAllEntityTypes()),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  snippet: fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('<') && !s.includes('>')),
  relevance_score: fc.double({ min: 0, max: 1 }),
  metadata: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.integer({ min: 0, max: 1000000 }),
      fc.double({ min: 0, max: 1000000 }),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString())
    ),
    { minKeys: 0, maxKeys: 5 }
  ),
});

// Feature: erp-search-ui, Property 15: Search Result Display Format
describe('Property 15: Search Result Display Format', () => {
  it('should display entity title, entity type badge, and text snippet for any search result', () => {
    fc.assert(
      fc.property(searchResultArbitrary, (result: SearchResult) => {
        const { container } = render(
          <SearchResultItem
            result={result}
            isHighlighted={false}
            onClick={() => {}}
            onMouseEnter={() => {}}
          />
        );

        // Verify title is rendered in an H3 element
        const titleElement = container.querySelector('h3');
        expect(titleElement).toBeDefined();
        expect(titleElement?.textContent).toBe(result.title);

        // Verify entity type badge is rendered
        const badgeElement = container.querySelector('.inline-flex');
        expect(badgeElement).toBeDefined();
        expect(badgeElement?.textContent).toBeTruthy();

        // Verify snippet is rendered (if not empty)
        if (result.snippet && result.snippet.trim().length > 0) {
          // The snippet is rendered with dangerouslySetInnerHTML
          // Check that the snippet div exists and has content
          const snippetDiv = container.querySelector('.line-clamp-2');
          expect(snippetDiv).toBeDefined();
          expect(snippetDiv?.innerHTML).toBeTruthy();
        }

        // Verify all three required elements are present in the DOM
        expect(container.querySelector('h3')).toBeDefined(); // Title
        expect(container.querySelector('.inline-flex')).toBeDefined(); // Badge
        expect(container.querySelector('[role="button"]')).toBeDefined(); // Interactive element
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.1
 */

// Feature: erp-search-ui, Property 16: Query Term Highlighting
describe('Property 16: Query Term Highlighting', () => {
  it('should wrap query terms in <mark> tags when present in snippet', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3 && !s.includes('<') && !s.includes('>')),
        fc.string({ minLength: 20, maxLength: 100 }).filter(s => !s.includes('<') && !s.includes('>')),
        (queryTerm, surroundingText) => {
          // Create a snippet with the query term highlighted using <mark> tags
          const snippet = `${surroundingText.substring(0, 30)} <mark>${queryTerm}</mark> ${surroundingText.substring(30)}`;
          
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'items',
            title: 'Test Item',
            snippet: snippet,
            relevance_score: 0.9,
            metadata: {},
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that <mark> tags are present in the rendered HTML
          const snippetDiv = container.querySelector('.line-clamp-2');
          expect(snippetDiv).toBeDefined();
          
          if (snippetDiv) {
            const markElements = snippetDiv.querySelectorAll('mark');
            expect(markElements.length).toBeGreaterThan(0);
            
            // Verify the marked text contains the query term
            const markedText = Array.from(markElements).map(el => el.textContent).join(' ');
            expect(markedText).toContain(queryTerm);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple query term highlights in a snippet', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length >= 3 && !s.includes('<') && !s.includes('>')),
        fc.integer({ min: 2, max: 5 }),
        (queryTerm, occurrences) => {
          // Create a snippet with multiple occurrences of the query term
          const parts = Array(occurrences + 1).fill('some text here');
          const snippet = parts.join(` <mark>${queryTerm}</mark> `);
          
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'customers',
            title: 'Test Customer',
            snippet: snippet,
            relevance_score: 0.8,
            metadata: {},
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that all occurrences are marked
          const snippetDiv = container.querySelector('.line-clamp-2');
          if (snippetDiv) {
            const markElements = snippetDiv.querySelectorAll('mark');
            expect(markElements.length).toBe(occurrences);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.3
 */

// Feature: erp-search-ui, Property 20: Metadata Formatting
describe('Property 20: Metadata Formatting', () => {
  it('should format date metadata according to user locale', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        (date) => {
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'invoices',
            title: 'Test Invoice',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {
              invoice_date: date.toISOString(),
              due_date: date.toISOString(),
            },
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that dates are formatted (not raw ISO strings)
          const metadataDiv = container.querySelector('.flex.flex-wrap.gap-3');
          expect(metadataDiv).toBeDefined();
          
          if (metadataDiv) {
            const text = metadataDiv.textContent || '';
            // Should not contain raw ISO format (with T and Z)
            expect(text).not.toContain('T');
            expect(text).not.toContain('Z');
            
            // Should contain formatted date parts (month names or numbers)
            const expectedFormat = new Intl.DateTimeFormat(navigator.language, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(date);
            
            expect(text).toContain(expectedFormat);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format number metadata with locale-specific separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000 }),
        (number) => {
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'items',
            title: 'Test Item',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {
              quantity: number,
              stock_level: number,
            },
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that numbers are formatted with locale separators
          const metadataDiv = container.querySelector('.flex.flex-wrap.gap-3');
          expect(metadataDiv).toBeDefined();
          
          if (metadataDiv) {
            const text = metadataDiv.textContent || '';
            const expectedFormat = new Intl.NumberFormat(navigator.language).format(number);
            expect(text).toContain(expectedFormat);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format currency metadata with currency symbol', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 100000, noNaN: true }),
        (amount) => {
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'invoices',
            title: 'Test Invoice',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {
              total_amount: amount,
              price: amount,
            },
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that currency is formatted with symbol
          const metadataDiv = container.querySelector('.flex.flex-wrap.gap-3');
          expect(metadataDiv).toBeDefined();
          
          if (metadataDiv) {
            const text = metadataDiv.textContent || '';
            const expectedFormat = new Intl.NumberFormat(navigator.language, {
              style: 'currency',
              currency: 'USD',
            }).format(amount);
            
            expect(text).toContain(expectedFormat);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed metadata types correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          number: fc.integer({ min: 100, max: 10000 }),
          amount: fc.double({ min: 10, max: 10000, noNaN: true }),
          text: fc.string({ minLength: 1, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
        }),
        (data) => {
          const result: SearchResult = {
            entity_id: '123',
            entity_type: 'invoices',
            title: 'Test Invoice',
            snippet: 'Test snippet',
            relevance_score: 0.9,
            metadata: {
              created_date: data.date.toISOString(),
              item_count: data.number,
              total_price: data.amount,
              status: data.text,
            },
          };

          const { container } = render(
            <SearchResultItem
              result={result}
              isHighlighted={false}
              onClick={() => {}}
              onMouseEnter={() => {}}
            />
          );

          // Verify that all metadata is rendered
          const metadataDiv = container.querySelector('.flex.flex-wrap.gap-3');
          expect(metadataDiv).toBeDefined();
          
          if (metadataDiv) {
            const text = metadataDiv.textContent || '';
            
            // Date should be formatted
            const expectedDate = new Intl.DateTimeFormat(navigator.language, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(data.date);
            expect(text).toContain(expectedDate);
            
            // Number should be formatted
            const expectedNumber = new Intl.NumberFormat(navigator.language).format(data.number);
            expect(text).toContain(expectedNumber);
            
            // Currency should be formatted
            const expectedCurrency = new Intl.NumberFormat(navigator.language, {
              style: 'currency',
              currency: 'USD',
            }).format(data.amount);
            expect(text).toContain(expectedCurrency);
            
            // Text should be present (at least some alphanumeric characters)
            expect(text).toMatch(/[a-zA-Z0-9]/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Validates: Requirements 6.7
 */
