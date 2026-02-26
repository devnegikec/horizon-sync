import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuotationManagement } from '../../../../app/components/quotations/QuotationManagement';
import { useQuotationManagement } from '../../../../app/hooks/useQuotationManagement';
import type { Quotation } from '../../../../app/types/quotation.types';

// Mock the hook
jest.mock('../../../../app/hooks/useQuotationManagement');

// Mock child components
jest.mock('../../../../app/components/quotations/QuotationManagementHeader', () => ({
  QuotationManagementHeader: ({ onRefresh, onCreateQuotation, isLoading }: any) => (
    <div data-testid="quotation-header">
      <button onClick={onRefresh} disabled={isLoading}>Refresh</button>
      <button onClick={onCreateQuotation}>New Quotation</button>
    </div>
  ),
}));

jest.mock('../../../../app/components/quotations/QuotationStats', () => ({
  QuotationStats: ({ total, draft, sent, accepted }: any) => (
    <div data-testid="quotation-stats">
      <div>Total: {total}</div>
      <div>Draft: {draft}</div>
      <div>Sent: {sent}</div>
      <div>Accepted: {accepted}</div>
    </div>
  ),
}));

jest.mock('../../../../app/components/quotations/QuotationManagementFilters', () => ({
  QuotationManagementFilters: ({ filters, setFilters }: any) => (
    <div data-testid="quotation-filters">
      <input
        data-testid="search-input"
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
      <select
        data-testid="status-select"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="all">All</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
      </select>
    </div>
  ),
}));

jest.mock('../../../../app/components/quotations/QuotationsTable', () => ({
  QuotationsTable: ({ quotations, loading, error, onView, onEdit, onDelete, onCreateQuotation }: any) => (
    <div data-testid="quotations-table">
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && quotations.map((q: Quotation) => (
        <div key={q.id} data-testid={`quotation-${q.id}`}>
          <span>{q.quotation_no}</span>
          <button onClick={() => onView(q)}>View</button>
          <button onClick={() => onEdit(q)}>Edit</button>
          <button onClick={() => onDelete(q)}>Delete</button>
        </div>
      ))}
      {!loading && !error && quotations.length === 0 && (
        <button onClick={onCreateQuotation}>Create First Quotation</button>
      )}
    </div>
  ),
}));

jest.mock('../../../../app/components/quotations/QuotationDetailDialog', () => ({
  QuotationDetailDialog: ({ open, quotation, onEdit, onConvert }: any) => (
    open ? (
      <div data-testid="detail-dialog">
        <div>Quotation: {quotation?.quotation_no}</div>
        <button onClick={() => onEdit(quotation)}>Edit</button>
        <button onClick={() => onConvert(quotation)}>Convert</button>
      </div>
    ) : null
  ),
}));

jest.mock('../../../../app/components/quotations/QuotationDialog', () => ({
  QuotationDialog: ({ open, quotation, onSave }: any) => (
    open ? (
      <div data-testid="quotation-dialog">
        <div>Editing: {quotation?.quotation_no || 'New Quotation'}</div>
        <button onClick={() => onSave({}, quotation?.id)}>Save</button>
      </div>
    ) : null
  ),
}));

describe('QuotationManagement', () => {
  const mockQuotations: Quotation[] = [
    {
      id: 'quotation-1',
      quotation_no: 'QT-2026-001',
      organization_id: 'org-1',
      customer_id: 'customer-1',
      customer_name: 'Customer A',
      quotation_date: '2026-01-15T00:00:00Z',
      valid_until: '2026-02-15T00:00:00Z',
      grand_total: '1000.00',
      currency: 'USD',
      status: 'draft',
      line_items: [],
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'quotation-2',
      quotation_no: 'QT-2026-002',
      organization_id: 'org-1',
      customer_id: 'customer-2',
      customer_name: 'Customer B',
      quotation_date: '2026-01-16T00:00:00Z',
      valid_until: '2026-02-16T00:00:00Z',
      grand_total: '2000.00',
      currency: 'EUR',
      status: 'sent',
      line_items: [],
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2026-01-16T10:00:00Z',
      updated_at: '2026-01-16T10:00:00Z',
    },
  ];

  const mockHookReturn = {
    filters: { search: '', status: 'all' },
    setFilters: jest.fn(),
    quotations: mockQuotations,
    loading: false,
    error: null,
    refetch: jest.fn(),
    stats: { total: 2, draft: 1, sent: 1, accepted: 0 },
    detailDialogOpen: false,
    setDetailDialogOpen: jest.fn(),
    createDialogOpen: false,
    setCreateDialogOpen: jest.fn(),
    selectedQuotation: null,
    editQuotation: null,
    tableInstance: null,
    handleView: jest.fn(),
    handleCreate: jest.fn(),
    handleEdit: jest.fn(),
    handleDelete: jest.fn(),
    handleConvert: jest.fn(),
    handleTableReady: jest.fn(),
    handleSave: jest.fn(),
    serverPaginationConfig: {
      pageIndex: 0,
      pageSize: 20,
      totalItems: 2,
      onPaginationChange: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuotationManagement as jest.Mock).mockReturnValue(mockHookReturn);
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Component rendering', () => {
    it('should render all sections', () => {
      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByTestId('quotation-header')).toBeTruthy();
      expect(screen.getByTestId('quotation-stats')).toBeTruthy();
      expect(screen.getByTestId('quotation-filters')).toBeTruthy();
      expect(screen.getByTestId('quotations-table')).toBeTruthy();
    });

    it('should display quotations in the table', () => {
      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByText('QT-2026-001')).toBeTruthy();
      expect(screen.getByText('QT-2026-002')).toBeTruthy();
    });

    it('should display correct statistics', () => {
      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByText('Total: 2')).toBeTruthy();
      expect(screen.getByText('Draft: 1')).toBeTruthy();
      expect(screen.getByText('Sent: 1')).toBeTruthy();
      expect(screen.getByText('Accepted: 0')).toBeTruthy();
    });
  });

  describe('Filter changes', () => {
    it('should trigger data refresh when search filter changes', () => {
      renderWithQueryClient(<QuotationManagement />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'QT-2026' } });

      expect(mockHookReturn.setFilters).toHaveBeenCalledWith({
        search: 'QT-2026',
        status: 'all',
      });
    });

    it('should trigger data refresh when status filter changes', () => {
      renderWithQueryClient(<QuotationManagement />);

      const statusSelect = screen.getByTestId('status-select');
      fireEvent.change(statusSelect, { target: { value: 'draft' } });

      expect(mockHookReturn.setFilters).toHaveBeenCalledWith({
        search: '',
        status: 'draft',
      });
    });
  });

  describe('Create quotation flow', () => {
    it('should open create dialog when New Quotation button is clicked', () => {
      renderWithQueryClient(<QuotationManagement />);

      const newQuotationButton = screen.getByText('New Quotation');
      fireEvent.click(newQuotationButton);

      expect(mockHookReturn.handleCreate).toHaveBeenCalled();
    });

    it('should display create dialog when createDialogOpen is true', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        createDialogOpen: true,
        editQuotation: null,
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByTestId('quotation-dialog')).toBeTruthy();
      expect(screen.getByText('Editing: New Quotation')).toBeTruthy();
    });
  });

  describe('Edit quotation flow', () => {
    it('should call handleEdit when Edit button is clicked', () => {
      renderWithQueryClient(<QuotationManagement />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(mockHookReturn.handleEdit).toHaveBeenCalledWith(mockQuotations[0]);
    });

    it('should display edit dialog with quotation data', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        createDialogOpen: true,
        editQuotation: mockQuotations[0],
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByTestId('quotation-dialog')).toBeTruthy();
      expect(screen.getByText('Editing: QT-2026-001')).toBeTruthy();
    });
  });

  describe('View quotation flow', () => {
    it('should call handleView when View button is clicked', () => {
      renderWithQueryClient(<QuotationManagement />);

      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);

      expect(mockHookReturn.handleView).toHaveBeenCalledWith(mockQuotations[0]);
    });

    it('should display detail dialog when detailDialogOpen is true', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        detailDialogOpen: true,
        selectedQuotation: mockQuotations[0],
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByTestId('detail-dialog')).toBeTruthy();
      expect(screen.getByText('Quotation: QT-2026-001')).toBeTruthy();
    });
  });

  describe('Delete quotation flow', () => {
    it('should call handleDelete when Delete button is clicked', () => {
      renderWithQueryClient(<QuotationManagement />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(mockHookReturn.handleDelete).toHaveBeenCalledWith(mockQuotations[0]);
    });
  });

  describe('Error handling', () => {
    it('should display error message when error occurs', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to load quotations',
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByText('Error loading quotations: Failed to load quotations')).toBeTruthy();
    });

    it('should not display error when error is null', () => {
      renderWithQueryClient(<QuotationManagement />);

      expect(screen.queryByText(/Error loading quotations/)).toBeNull();
    });
  });

  describe('Loading state', () => {
    it('should display loading state in table', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        loading: true,
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('should disable refresh button when loading', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        loading: true,
      });

      renderWithQueryClient(<QuotationManagement />);

      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toHaveProperty('disabled', true);
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no quotations', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        quotations: [],
        stats: { total: 0, draft: 0, sent: 0, accepted: 0 },
      });

      renderWithQueryClient(<QuotationManagement />);

      expect(screen.getByText('Create First Quotation')).toBeTruthy();
    });
  });

  describe('Refresh functionality', () => {
    it('should call refetch when Refresh button is clicked', () => {
      renderWithQueryClient(<QuotationManagement />);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockHookReturn.refetch).toHaveBeenCalled();
    });
  });

  describe('Convert quotation flow', () => {
    it('should call handleConvert when Convert button is clicked in detail dialog', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        detailDialogOpen: true,
        selectedQuotation: mockQuotations[0],
      });

      renderWithQueryClient(<QuotationManagement />);

      const convertButton = screen.getByText('Convert');
      fireEvent.click(convertButton);

      expect(mockHookReturn.handleConvert).toHaveBeenCalledWith(mockQuotations[0]);
    });
  });

  describe('Save functionality', () => {
    it('should call handleSave when Save button is clicked in dialog', () => {
      (useQuotationManagement as jest.Mock).mockReturnValue({
        ...mockHookReturn,
        createDialogOpen: true,
        editQuotation: mockQuotations[0],
      });

      renderWithQueryClient(<QuotationManagement />);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockHookReturn.handleSave).toHaveBeenCalledWith({}, mockQuotations[0].id);
    });
  });
});
