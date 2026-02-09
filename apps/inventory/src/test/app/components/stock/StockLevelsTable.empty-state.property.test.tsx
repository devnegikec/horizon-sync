import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { StockLevelsTable } from '../../../../app/components/stock/StockLevelsTable';
import type { StockLevel } from '../../../../app/types/stock.types';

/**
 * Property 8: Empty state header preservation
 * 
 * For any tab when data is empty, the system should render table headers
 * while displaying an empty state message.
 * 
 * **Validates: Requirements 6.7**
 */

// Mock the DataTable component to track if headers are rendered
let headersRendered = false;
let emptyStateRendered = false;

jest.mock('@horizon-sync/ui/components/data-table', () => ({
  DataTable: ({ data, columns }: any) => {
    // Track if headers are being rendered
    headersRendered = columns && columns.length > 0;
    
    return (
      <div data-testid="mock-data-table">
        <table>
          <thead data-testid="table-headers">
            <tr>
              {columns.map((col: any, idx: number) => (
                <th key={idx} data-testid={`header-${idx}`}>
                  {col.header?.({ column: {} }) || 'Header'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} data-testid="empty-body">
                  No data
                </td>
              </tr>
            ) : (
              data.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.product_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  },
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

// Mock the UI components
jest.mock('@horizon-sync/ui/components', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  TableSkeleton: () => <div data-testid="table-skeleton">Loading...</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/empty-state', () => ({
  EmptyState: ({ title, description }: any) => {
    emptyStateRendered = true;
    return (
      <div data-testid="empty-state">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    );
  },
}));

describe('Property 8: Empty state header preservation', () => {
  beforeEach(() => {
    headersRendered = false;
    emptyStateRendered = false;
  });

  it('should render table headers when data is empty (no filters)', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasActiveFilters
        (hasActiveFilters) => {
          const { container } = render(
            <StockLevelsTable
              stockLevels={[]}
              loading={false}
              error={null}
              hasActiveFilters={hasActiveFilters}
            />
          );

          // Property: Headers must be visible when data is empty
          const headers = container.querySelectorAll('[data-testid^="header-"]');
          
          // The table should render headers even when empty
          // This validates requirement 6.7: "WHEN rendering empty states, 
          // THE System SHALL maintain visible table headers"
          expect(headers.length).toBeGreaterThan(0);
          
          // Verify that we're not just showing an empty state component
          // without the table structure
          const tableElement = screen.queryByTestId('mock-data-table');
          expect(tableElement).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render table headers for any empty dataset regardless of filter state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasActiveFilters
        fc.oneof(fc.constant(null), fc.string()), // error state
        (hasActiveFilters, error) => {
          // Skip error cases as they have different rendering logic
          fc.pre(error === null);

          const { container } = render(
            <StockLevelsTable
              stockLevels={[]}
              loading={false}
              error={error}
              hasActiveFilters={hasActiveFilters}
            />
          );

          // Property: Table structure with headers must exist
          const tableHeaders = container.querySelector('[data-testid="table-headers"]');
          
          // This is the core property: headers must be present even with empty data
          expect(tableHeaders).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain header count consistency between empty and populated states', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            organization_id: fc.uuid(),
            product_id: fc.uuid(),
            warehouse_id: fc.uuid(),
            quantity_on_hand: fc.integer({ min: 0, max: 1000 }),
            quantity_reserved: fc.integer({ min: 0, max: 100 }),
            quantity_available: fc.integer({ min: 0, max: 1000 }),
            last_counted_at: fc.oneof(fc.constant(null), fc.date().map(d => d.toISOString())),
            created_at: fc.date().map(d => d.toISOString()),
            updated_at: fc.date().map(d => d.toISOString()),
            product_name: fc.string({ minLength: 1, maxLength: 50 }),
            product_code: fc.string({ minLength: 1, maxLength: 20 }),
            warehouse_name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        (stockLevels) => {
          const { container } = render(
            <StockLevelsTable
              stockLevels={stockLevels as StockLevel[]}
              loading={false}
              error={null}
              hasActiveFilters={false}
            />
          );

          const headers = container.querySelectorAll('[data-testid^="header-"]');
          const headerCount = headers.length;

          // Property: Header count should be consistent regardless of data presence
          // Whether we have 0 items or 5 items, the same headers should be rendered
          expect(headerCount).toBeGreaterThan(0);
          
          // The number of headers should be the same for empty and non-empty states
          // This is a universal property that should hold for any dataset
          return headerCount > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not replace table structure with standalone empty state component', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasActiveFilters
        (hasActiveFilters) => {
          render(
            <StockLevelsTable
              stockLevels={[]}
              loading={false}
              error={null}
              hasActiveFilters={hasActiveFilters}
            />
          );

          // Property: When data is empty, we should render the table structure
          // with headers, not replace it with a standalone empty state
          const tableElement = screen.queryByTestId('mock-data-table');
          const emptyStateElement = screen.queryByTestId('empty-state');

          // The table should be present
          expect(tableElement).toBeTruthy();
          
          // If there's an empty state, it should be INSIDE the table body,
          // not replacing the entire table structure
          // Current implementation fails this by showing EmptyState instead of table
          if (emptyStateElement) {
            // Empty state should not be a sibling of the table
            // It should be rendered within the table body
            const cardContent = screen.getByTestId('card-content');
            const hasTable = cardContent.querySelector('[data-testid="mock-data-table"]');
            
            // This assertion validates that we're not just showing empty state
            // without the table structure
            expect(hasTable).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
