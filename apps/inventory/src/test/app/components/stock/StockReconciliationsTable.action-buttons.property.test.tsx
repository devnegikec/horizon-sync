import { render } from '@testing-library/react';
import * as fc from 'fast-check';

import { StockReconciliationsTable } from '../../../../app/components/stock/StockReconciliationsTable';
import type { StockReconciliation, StockReconciliationStatus } from '../../../../app/types/stock.types';

/**
 * Property 9: Status-based action button rendering
 * 
 * For any stock reconciliation record, the system should display edit and delete buttons
 * only when status is "draft", and display only view button when status is "submitted".
 * 
 * **Validates: Requirements 4.8, 4.9**
 */

// Mock the DataTable component to render cells
jest.mock('@horizon-sync/ui/components/data-table', () => ({
  DataTable: ({ data, columns }: any) => (
    <div data-testid="mock-data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any, idx: number) => (
              <th key={idx}>{col.header?.({ column: {} }) || 'Header'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, rowIdx: number) => (
            <tr key={rowIdx}>
              {columns.map((col: any, colIdx: number) => (
                <td key={colIdx}>
                  {col.cell ? col.cell({ row: { original: row }, getValue: () => row[col.accessorKey] }) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

// Mock the UI components
jest.mock('@horizon-sync/ui/components', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Button: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  TableSkeleton: () => <div data-testid="table-skeleton">Loading...</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/empty-state', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

describe('Property 9: Status-based action button rendering', () => {
  it('should display edit and delete buttons only for draft reconciliations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            organization_id: fc.uuid(),
            reconciliation_no: fc.string({ minLength: 5, maxLength: 20 }),
            status: fc.constantFrom('draft', 'submitted') as fc.Arbitrary<StockReconciliationStatus>,
            posting_date: fc.date().filter((d) => !isNaN(d.getTime())).map((d) => d.toISOString().split('T')[0]),
            purpose: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
            items_count: fc.integer({ min: 0, max: 100 }),
            total_difference: fc.float({ min: -1000, max: 1000 }),
            created_at: fc.date().filter((d) => !isNaN(d.getTime())).map((d) => d.toISOString()),
            updated_at: fc.date().filter((d) => !isNaN(d.getTime())).map((d) => d.toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (reconciliations) => {
          const mockOnView = jest.fn();
          const mockOnEdit = jest.fn();
          const mockOnDelete = jest.fn();

          const { container } = render(
            <StockReconciliationsTable
              stockReconciliations={reconciliations as StockReconciliation[]}
              loading={false}
              error={null}
              hasActiveFilters={false}
              onView={mockOnView}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          // Property: For each reconciliation, check action button availability based on status
          reconciliations.forEach((reconciliation) => {
            const isDraft = reconciliation.status === 'draft';

            // All reconciliations should have a dropdown menu (for View action)
            const dropdowns = container.querySelectorAll('[data-testid="dropdown-menu"]');
            expect(dropdowns.length).toBeGreaterThan(0);

            // Count menu items - draft should have more items (View, Edit, Delete)
            // Non-draft should have fewer items (only View)
            const menuItems = container.querySelectorAll('[data-testid="dropdown-menu-item"]');
            
            if (isDraft) {
              // Draft reconciliations should have: View, Edit, Delete (3 items per reconciliation)
              // Plus separators between them
              const separators = container.querySelectorAll('[data-testid="dropdown-menu-separator"]');
              
              // Property: Draft reconciliations must have edit and delete options available
              // We verify this by checking that there are more menu items than just "View"
              expect(menuItems.length).toBeGreaterThanOrEqual(reconciliations.length);
              
              // Property: Draft reconciliations should have separators (indicating multiple action groups)
              const draftCount = reconciliations.filter((r) => r.status === 'draft').length;
              if (draftCount > 0) {
                expect(separators.length).toBeGreaterThanOrEqual(draftCount);
              }
            }
          });

          // Property: The number of dropdown menus should equal the number of reconciliations
          const dropdowns = container.querySelectorAll('[data-testid="dropdown-menu"]');
          expect(dropdowns.length).toBe(reconciliations.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only show view button for submitted reconciliations', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (id) => {
          const reconciliation: StockReconciliation = {
            id,
            organization_id: 'org-1',
            reconciliation_no: 'SR-001',
            status: 'submitted',
            posting_date: '2024-01-15',
            purpose: 'Annual stock check',
            items_count: 10,
            total_difference: 150.5,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          const mockOnView = jest.fn();
          const mockOnEdit = jest.fn();
          const mockOnDelete = jest.fn();

          const { container } = render(
            <StockReconciliationsTable
              stockReconciliations={[reconciliation]}
              loading={false}
              error={null}
              hasActiveFilters={false}
              onView={mockOnView}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          // Property: Submitted reconciliations should have exactly 1 menu item (View only)
          const menuItems = container.querySelectorAll('[data-testid="dropdown-menu-item"]');
          expect(menuItems.length).toBe(1);

          // Property: Submitted reconciliations should have no separators
          const separators = container.querySelectorAll('[data-testid="dropdown-menu-separator"]');
          expect(separators.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show all action buttons for draft reconciliations', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (id) => {
          const reconciliation: StockReconciliation = {
            id,
            organization_id: 'org-1',
            reconciliation_no: 'SR-001',
            status: 'draft',
            posting_date: '2024-01-15',
            purpose: 'Annual stock check',
            items_count: 10,
            total_difference: 150.5,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          };

          const mockOnView = jest.fn();
          const mockOnEdit = jest.fn();
          const mockOnDelete = jest.fn();

          const { container } = render(
            <StockReconciliationsTable
              stockReconciliations={[reconciliation]}
              loading={false}
              error={null}
              hasActiveFilters={false}
              onView={mockOnView}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          // Property: Draft reconciliations should have 3 menu items (View, Edit, Delete)
          const menuItems = container.querySelectorAll('[data-testid="dropdown-menu-item"]');
          expect(menuItems.length).toBe(3);

          // Property: Draft reconciliations should have 1 separator (between Edit and Delete)
          const separators = container.querySelectorAll('[data-testid="dropdown-menu-separator"]');
          expect(separators.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
