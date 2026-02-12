import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuotationsTable } from '../../../../app/components/quotations/QuotationsTable';
import type { Quotation } from '../../../../app/types/quotation.types';

describe('QuotationsTable', () => {
  const mockOnView = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnCreateQuotation = jest.fn();
  const mockOnTableReady = jest.fn();

  const mockQuotations: Quotation[] = [
    {
      id: 'quotation-1',
      quotation_no: 'QT-2026-001',
      organization_id: 'org-1',
      customer_id: 'customer-1',
      customer_name: 'Customer A',
      customer: {
        customer_code: 'CUST-A',
        customer_name: 'Customer A',
      },
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
      customer: {
        customer_code: 'CUST-B',
        customer_name: 'Customer B',
      },
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
    {
      id: 'quotation-3',
      quotation_no: 'QT-2026-003',
      organization_id: 'org-1',
      customer_id: 'customer-3',
      customer_name: 'Customer C',
      customer: {
        customer_code: 'CUST-C',
        customer_name: 'Customer C',
      },
      quotation_date: '2026-01-17T00:00:00Z',
      valid_until: '2026-02-17T00:00:00Z',
      grand_total: '3000.00',
      currency: 'GBP',
      status: 'accepted',
      line_items: [],
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2026-01-17T10:00:00Z',
      updated_at: '2026-01-17T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Table rendering', () => {
    it('should render table with correct columns', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that column headers are present
      expect(screen.getByText('Quotation #')).toBeTruthy();
      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Quotation Date')).toBeTruthy();
      expect(screen.getByText('Valid Until')).toBeTruthy();
      expect(screen.getByText('Grand Total')).toBeTruthy();
      expect(screen.getByText('Status')).toBeTruthy();
    });

    it('should render quotation data in table rows', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that quotation numbers are displayed
      expect(screen.getByText('QT-2026-001')).toBeTruthy();
      expect(screen.getByText('QT-2026-002')).toBeTruthy();
      expect(screen.getByText('QT-2026-003')).toBeTruthy();

      // Check that customer names are displayed
      expect(screen.getByText('Customer A')).toBeTruthy();
      expect(screen.getByText('Customer B')).toBeTruthy();
      expect(screen.getByText('Customer C')).toBeTruthy();

      // Check that grand totals are displayed with currency
      expect(screen.getByText('USD 1000.00')).toBeTruthy();
      expect(screen.getByText('EUR 2000.00')).toBeTruthy();
      expect(screen.getByText('GBP 3000.00')).toBeTruthy();
    });

    it('should display customer codes when available', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that customer codes are displayed
      expect(screen.getByText('CUST-A')).toBeTruthy();
      expect(screen.getByText('CUST-B')).toBeTruthy();
      expect(screen.getByText('CUST-C')).toBeTruthy();
    });
  });

  describe('Row actions', () => {
    it('should render action menu buttons for each quotation row', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that action buttons are present in the table
      // There will be multiple buttons with aria-haspopup="menu" (column headers + row actions)
      const menuButtons = screen.getAllByRole('button').filter(btn => 
        btn.getAttribute('aria-haspopup') === 'menu'
      );
      // We should have at least one menu button per row (plus column header menus)
      expect(menuButtons.length).toBeGreaterThanOrEqual(mockQuotations.length);
    });
  });

  describe('Empty state', () => {
    it('should display empty state when no quotations and no filters', () => {
      render(
        <QuotationsTable
          quotations={[]}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      expect(screen.getByText('No quotations found')).toBeTruthy();
      expect(screen.getByText('Get started by creating your first quotation')).toBeTruthy();
      expect(screen.getByText('New Quotation')).toBeTruthy();
    });

    it('should display empty state with filter message when filters are active', () => {
      render(
        <QuotationsTable
          quotations={[]}
          loading={false}
          error={null}
          hasActiveFilters={true}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      expect(screen.getByText('No quotations found')).toBeTruthy();
      expect(screen.getByText('Try adjusting your search or filters')).toBeTruthy();
      // Should not show New Quotation button when filters are active
      expect(screen.queryByText('New Quotation')).toBeNull();
    });

    it('should call onCreateQuotation when New Quotation button is clicked in empty state', () => {
      render(
        <QuotationsTable
          quotations={[]}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      const newQuotationButton = screen.getByText('New Quotation');
      fireEvent.click(newQuotationButton);

      expect(mockOnCreateQuotation).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should display loading state when loading is true', () => {
      const { container } = render(
        <QuotationsTable
          quotations={[]}
          loading={true}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that the component renders something (not empty)
      expect(container.firstChild).toBeTruthy();
      // The table skeleton component should be rendered
      expect(container.querySelector('table')).toBeTruthy();
    });

    it('should not display quotations when loading', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={true}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Quotation numbers should not be visible during loading
      expect(screen.queryByText('QT-2026-001')).toBeNull();
      expect(screen.queryByText('QT-2026-002')).toBeNull();
    });
  });

  describe('Error state', () => {
    it('should display error message when error is present', () => {
      const errorMessage = 'Failed to load quotations';
      render(
        <QuotationsTable
          quotations={[]}
          loading={false}
          error={errorMessage}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('should not display quotations when error is present', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error="Error occurred"
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Quotation numbers should not be visible when there's an error
      expect(screen.queryByText('QT-2026-001')).toBeNull();
    });
  });

  describe('Server pagination', () => {
    it('should render with server pagination config', () => {
      const mockPaginationChange = jest.fn();
      const serverPagination = {
        pageIndex: 0,
        pageSize: 20,
        totalItems: 100,
        onPaginationChange: mockPaginationChange,
      };

      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
          serverPagination={serverPagination}
        />
      );

      // Table should render with quotations
      expect(screen.getByText('QT-2026-001')).toBeTruthy();
    });

    it('should call onTableReady when table is ready', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
          onTableReady={mockOnTableReady}
        />
      );

      // onTableReady should be called with table instance
      expect(mockOnTableReady).toHaveBeenCalled();
    });
  });

  describe('Status badges', () => {
    it('should display status badges for all quotations', () => {
      render(
        <QuotationsTable
          quotations={mockQuotations}
          loading={false}
          error={null}
          hasActiveFilters={false}
          onView={mockOnView}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onCreateQuotation={mockOnCreateQuotation}
        />
      );

      // Check that status badges are displayed
      expect(screen.getByText('Draft')).toBeTruthy();
      expect(screen.getByText('Sent')).toBeTruthy();
      expect(screen.getByText('Accepted')).toBeTruthy();
    });
  });
});
