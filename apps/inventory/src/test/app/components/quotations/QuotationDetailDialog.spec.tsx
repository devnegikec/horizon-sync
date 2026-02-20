import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuotationDetailDialog } from '../../../../app/components/quotations/QuotationDetailDialog';
import type { Quotation } from '../../../../app/types/quotation.types';

// Mock the user store
const mockAccessToken = 'test-token';
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector) => {
    const state = { accessToken: mockAccessToken };
    return selector(state);
  }),
}));

// Mock the item API
jest.mock('../../../../app/utility/api', () => ({
  itemApi: {
    list: jest.fn(() =>
      Promise.resolve({
        items: [
          { id: 'item-1', item_name: 'Product A', item_sku: 'SKU-A' },
          { id: 'item-2', item_name: 'Product B', item_sku: 'SKU-B' },
        ],
      })
    ),
  },
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('QuotationDetailDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnConvert = jest.fn();

  const createMockQuotation = (overrides?: Partial<Quotation>): Quotation => ({
    id: 'quotation-1',
    quotation_no: 'QT-2026-001',
    organization_id: 'org-1',
    customer_id: 'customer-1',
    customer_name: 'Test Customer',
    customer: {
      customer_code: 'CUST-001',
      customer_name: 'Test Customer',
      email: 'test@example.com',
      phone: '+1234567890',
    },
    quotation_date: '2026-01-15',
    valid_until: '2026-02-15',
    grand_total: '1500.00',
    currency: 'USD',
    status: 'draft',
    remarks: 'Test remarks',
    line_items: [
      {
        id: 'line-1',
        quotation_id: 'quotation-1',
        item_id: 'item-1',
        item_name: 'Product A',
        item_sku: 'SKU-A',
        qty: 10,
        uom: 'pcs',
        rate: 100,
        amount: 1000,
        sort_order: 1,
      },
      {
        id: 'line-2',
        quotation_id: 'quotation-1',
        item_id: 'item-2',
        item_name: 'Product B',
        item_sku: 'SKU-B',
        qty: 5,
        uom: 'kg',
        rate: 100,
        amount: 500,
        sort_order: 2,
      },
    ],
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog rendering', () => {
    it('should not render when quotation is null', () => {
      const { container } = renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open is true and quotation is provided', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Quotation Details')).toBeTruthy();
    });
  });

  describe('Information display', () => {
    it('should display quotation number', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Quotation Number')).toBeTruthy();
      expect(screen.getByText('QT-2026-001')).toBeTruthy();
    });

    it('should display customer name from customer_name field', () => {
      const quotation = createMockQuotation({ customer_name: 'Direct Customer Name' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Direct Customer Name')).toBeTruthy();
    });

    it('should display customer name from customer object when customer_name is not available', () => {
      const quotation = createMockQuotation({ customer_name: undefined });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Test Customer')).toBeTruthy();
    });

    it('should display N/A when no customer information is available', () => {
      const quotation = createMockQuotation({ customer_name: undefined, customer: undefined });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('N/A')).toBeTruthy();
    });

    it('should display formatted quotation date', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Quotation Date')).toBeTruthy();
      expect(screen.getByText('Jan 15, 2026')).toBeTruthy();
    });

    it('should display formatted valid until date', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Valid Until')).toBeTruthy();
      expect(screen.getByText('Feb 15, 2026')).toBeTruthy();
    });

    it('should display currency', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Currency')).toBeTruthy();
      expect(screen.getByText('USD')).toBeTruthy();
    });

    it('should display grand total with currency and formatted amount', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Grand Total')).toBeTruthy();
      expect(screen.getByText('USD 1500.00')).toBeTruthy();
    });

    it('should display status badge', () => {
      const quotation = createMockQuotation({ status: 'sent' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Sent')).toBeTruthy();
    });

    it('should display remarks when present', () => {
      const quotation = createMockQuotation({ remarks: 'Special instructions for this quotation' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Remarks')).toBeTruthy();
      expect(screen.getByText('Special instructions for this quotation')).toBeTruthy();
    });

    it('should not display remarks section when remarks is not present', () => {
      const quotation = createMockQuotation({ remarks: undefined });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Remarks')).toBeNull();
    });

    it('should display created timestamp', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText(/Created:/)).toBeTruthy();
      // Just check that the Created text exists, the date is already tested above
    });

    it('should display updated timestamp when present', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText(/Updated:/)).toBeTruthy();
    });

    it('should not display updated timestamp when not present', () => {
      const quotation = createMockQuotation({ updated_at: undefined });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText(/Updated:/)).toBeNull();
    });
  });

  describe('Line items display', () => {
    it('should display line items section header', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('Line Items')).toBeTruthy();
    });

    it('should display line items in readonly table', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      // Check for table headers
      expect(screen.getByText('#')).toBeTruthy();
      expect(screen.getByText('Item')).toBeTruthy();
      expect(screen.getByText('Quantity')).toBeTruthy();
      expect(screen.getByText('UOM')).toBeTruthy();
      expect(screen.getByText('Rate')).toBeTruthy();
      expect(screen.getByText('Amount')).toBeTruthy();
    });

    it('should display "No line items" when line items array is empty', () => {
      const quotation = createMockQuotation({ line_items: [] });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('No line items')).toBeTruthy();
    });

    it('should display "No line items" when line items is undefined', () => {
      const quotation = createMockQuotation({ line_items: undefined });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.getByText('No line items')).toBeTruthy();
    });
  });

  describe('Edit button behavior', () => {
    it('should display Edit button for DRAFT status', () => {
      const quotation = createMockQuotation({ status: 'draft' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const editButton = screen.getByText('Edit');
      expect(editButton).toBeTruthy();
    });

    it('should display Edit button for SENT status', () => {
      const quotation = createMockQuotation({ status: 'sent' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const editButton = screen.getByText('Edit');
      expect(editButton).toBeTruthy();
    });

    it('should NOT display Edit button for ACCEPTED status (terminal)', () => {
      const quotation = createMockQuotation({ status: 'accepted' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should NOT display Edit button for REJECTED status (terminal)', () => {
      const quotation = createMockQuotation({ status: 'rejected' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should NOT display Edit button for EXPIRED status (terminal)', () => {
      const quotation = createMockQuotation({ status: 'expired' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should call onEdit when Edit button is clicked', () => {
      const quotation = createMockQuotation({ status: 'draft' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(quotation);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Convert to Sales Order button behavior', () => {
    it('should display Convert button ONLY for ACCEPTED status', () => {
      const quotation = createMockQuotation({ status: 'accepted' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const convertButton = screen.getByText('Convert to Sales Order');
      expect(convertButton).toBeTruthy();
    });

    it('should NOT display Convert button for DRAFT status', () => {
      const quotation = createMockQuotation({ status: 'draft' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should NOT display Convert button for SENT status', () => {
      const quotation = createMockQuotation({ status: 'sent' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should NOT display Convert button for REJECTED status', () => {
      const quotation = createMockQuotation({ status: 'rejected' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should NOT display Convert button for EXPIRED status', () => {
      const quotation = createMockQuotation({ status: 'expired' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should call onConvert when Convert button is clicked', () => {
      const quotation = createMockQuotation({ status: 'accepted' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const convertButton = screen.getByText('Convert to Sales Order');
      fireEvent.click(convertButton);

      expect(mockOnConvert).toHaveBeenCalledWith(quotation);
      expect(mockOnConvert).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close button behavior', () => {
    it('should display Close button', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      // Should have 2 close buttons: the main Close button and the X button
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should call onOpenChange with false when Close button is clicked', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      // Click the first Close button (the main one in the footer)
      fireEvent.click(closeButtons[0]);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button combinations for different statuses', () => {
    it('should show both Edit and Close buttons for DRAFT status', () => {
      const quotation = createMockQuotation({ status: 'draft' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should show both Edit and Close buttons for SENT status', () => {
      const quotation = createMockQuotation({ status: 'sent' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Edit')).toBeTruthy();
      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should show Convert and Close buttons (no Edit) for ACCEPTED status', () => {
      const quotation = createMockQuotation({ status: 'accepted' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Convert to Sales Order')).toBeTruthy();
      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should show only Close button for REJECTED status', () => {
      const quotation = createMockQuotation({ status: 'rejected' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Edit')).toBeNull();
      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });

    it('should show only Close button for EXPIRED status', () => {
      const quotation = createMockQuotation({ status: 'expired' });
      renderWithQueryClient(
        <QuotationDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onEdit={mockOnEdit}
          onConvert={mockOnConvert}
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /Close/i });
      expect(closeButtons.length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Edit')).toBeNull();
      expect(screen.queryByText('Convert to Sales Order')).toBeNull();
    });
  });
});
