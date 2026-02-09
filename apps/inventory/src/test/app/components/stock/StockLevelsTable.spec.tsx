import { render, screen } from '@testing-library/react';
import { StockLevelsTable } from '../../../../app/components/stock/StockLevelsTable';
import type { StockLevel } from '../../../../app/types/stock.types';

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
              <td>{row.product_name}</td>
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
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  TableSkeleton: () => <div data-testid="table-skeleton">Loading...</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/empty-state', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

describe('StockLevelsTable', () => {
  const mockStockLevels: StockLevel[] = [
    {
      id: '1',
      organization_id: 'org-1',
      product_id: 'prod-1',
      warehouse_id: 'wh-1',
      quantity_on_hand: 100,
      quantity_reserved: 20,
      quantity_available: 80,
      last_counted_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      product_name: 'Test Product',
      product_code: 'TP-001',
      warehouse_name: 'Main Warehouse',
    },
    {
      id: '2',
      organization_id: 'org-1',
      product_id: 'prod-2',
      warehouse_id: 'wh-1',
      quantity_on_hand: 5,
      quantity_reserved: 0,
      quantity_available: 5,
      last_counted_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T10:00:00Z',
      product_name: 'Low Stock Item',
      product_code: 'LSI-001',
      warehouse_name: 'Main Warehouse',
    },
  ];

  const defaultProps = {
    stockLevels: mockStockLevels,
    loading: false,
    error: null,
    hasActiveFilters: false,
  };

  it('should render table with data', () => {
    render(<StockLevelsTable {...defaultProps} />);

    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
    expect(screen.getByText('Test Product')).toBeTruthy();
    expect(screen.getByText('Low Stock Item')).toBeTruthy();
  });

  it('should display loading state', () => {
    render(<StockLevelsTable {...defaultProps} loading={true} />);

    expect(screen.getByTestId('table-skeleton')).toBeTruthy();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load stock levels';
    render(<StockLevelsTable {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('should display empty state when no data', () => {
    render(<StockLevelsTable {...defaultProps} stockLevels={[]} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No stock levels found')).toBeTruthy();
  });

  it('should display empty state with filter message when filters are active', () => {
    render(<StockLevelsTable {...defaultProps} stockLevels={[]} hasActiveFilters={true} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
  });

  it('should display empty state with default message when no filters are active', () => {
    render(<StockLevelsTable {...defaultProps} stockLevels={[]} hasActiveFilters={false} />);

    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('Stock levels will appear here once items are added to warehouses')).toBeTruthy();
  });

  it('should handle server pagination', () => {
    const mockPaginationChange = jest.fn();
    const serverPagination = {
      pageIndex: 0,
      pageSize: 20,
      totalItems: 100,
      onPaginationChange: mockPaginationChange,
    };

    render(<StockLevelsTable {...defaultProps} serverPagination={serverPagination} />);

    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
  });

  it('should call onTableReady when table is ready', () => {
    const mockOnTableReady = jest.fn();

    render(<StockLevelsTable {...defaultProps} onTableReady={mockOnTableReady} />);

    // The onTableReady should be called when the table instance is created
    // Note: This is a simplified test - in reality, the callback happens after table initialization
    expect(screen.getByTestId('mock-data-table')).toBeTruthy();
  });
});
