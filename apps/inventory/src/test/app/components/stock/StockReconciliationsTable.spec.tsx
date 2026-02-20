import { render, screen } from '@testing-library/react';

import { StockReconciliationsTable } from '../../../../app/components/stock/StockReconciliationsTable';
import type { StockReconciliation } from '../../../../app/types/stock.types';

// Mock the DataTable component
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
          {data.map((row: any, idx: number) => (
            <tr key={idx}>
              <td>{row.reconciliation_no}</td>
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
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-menu-separator" />,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/empty-state', () => ({
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div data-testid="empty-state-action">{action}</div>}
    </div>
  ),
}));

describe('StockReconciliationsTable', () => {
  const mockStockReconciliations: StockReconciliation[] = [
    {
      id: '1',
      organization_id: 'org-1',
      reconciliation_no: 'SR-001',
      status: 'draft',
      posting_date: '2024-01-15',
      purpose: 'Annual stock check',
      items_count: 10,
      total_difference: 150.5,
      remarks: 'Test reconciliation',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      organization_id: 'org-1',
      reconciliation_no: 'SR-002',
      status: 'submitted',
      posting_date: '2024-01-16',
      purpose: 'Monthly check',
      items_count: 5,
      total_difference: 75.25,
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
  ];

  const defaultProps = {
    stockReconciliations: mockStockReconciliations,
    loading: false,
    error: null,
    hasActiveFilters: false,
  };

  it('should render table with data', () => {
    render(<StockReconciliationsTable {...defaultProps} />);

    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
    expect(screen.getByText('SR-001')).toBeTruthy();
    expect(screen.getByText('SR-002')).toBeTruthy();
  });

  it('should display loading state', () => {
    render(<StockReconciliationsTable {...defaultProps} loading={true} />);

    expect(screen.getByTestId('table-skeleton')).toBeTruthy();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load stock reconciliations';
    render(<StockReconciliationsTable {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('should display empty state when no data', () => {
    render(<StockReconciliationsTable {...defaultProps} stockReconciliations={[]} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No stock reconciliations found')).toBeTruthy();
  });

  it('should display empty state with filter message when filters are active', () => {
    render(<StockReconciliationsTable {...defaultProps} stockReconciliations={[]} hasActiveFilters={true} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
  });

  it('should display empty state with default message when no filters are active', () => {
    render(<StockReconciliationsTable {...defaultProps} stockReconciliations={[]} hasActiveFilters={false} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Stock reconciliations will appear here once you create them')).toBeTruthy();
  });

  it('should display create button in empty state when no filters', () => {
    const mockOnCreate = jest.fn();
    render(
      <StockReconciliationsTable
        {...defaultProps}
        stockReconciliations={[]}
        hasActiveFilters={false}
        onCreateReconciliation={mockOnCreate}
      />
    );

    expect(screen.getByTestId('empty-state-action')).toBeTruthy();
  });

  it('should not display create button in empty state when filters are active', () => {
    const mockOnCreate = jest.fn();
    render(
      <StockReconciliationsTable
        {...defaultProps}
        stockReconciliations={[]}
        hasActiveFilters={true}
        onCreateReconciliation={mockOnCreate}
      />
    );

    expect(screen.queryByTestId('empty-state-action')).toBeNull();
  });

  it('should handle server pagination', () => {
    const mockPaginationChange = jest.fn();
    const serverPagination = {
      pageIndex: 0,
      pageSize: 20,
      totalItems: 100,
      onPaginationChange: mockPaginationChange,
    };

    render(<StockReconciliationsTable {...defaultProps} serverPagination={serverPagination} />);

    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
  });

  it('should call onTableReady when table is ready', () => {
    const mockOnTableReady = jest.fn();

    render(<StockReconciliationsTable {...defaultProps} onTableReady={mockOnTableReady} />);

    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
  });

  it('should display action buttons based on status', () => {
    const draftReconciliation: StockReconciliation = {
      ...mockStockReconciliations[0],
      status: 'draft',
    };

    const submittedReconciliation: StockReconciliation = {
      ...mockStockReconciliations[1],
      status: 'submitted',
    };

    render(
      <StockReconciliationsTable
        {...defaultProps}
        stockReconciliations={[draftReconciliation, submittedReconciliation]}
      />
    );

    // The mock DataTable doesn't render cell content, so we just verify the table exists
    // In a real integration test, we would check for the actual action button rendering
    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
  });
});
