import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvertToSalesOrderDialog } from '../../../../app/components/quotations/ConvertToSalesOrderDialog';
import type { Quotation } from '../../../../app/types/quotation.types';

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

describe('ConvertToSalesOrderDialog', () => {
  const mockOnOpenChange = jest.fn();
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
    status: 'accepted',
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
    // Mock alert
    global.alert = jest.fn();
  });

  describe('Dialog rendering', () => {
    it('should not render when quotation is null', () => {
      const { container } = renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open is true and quotation is provided', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByRole('heading', { name: /Convert to Sales Order/i })).toBeTruthy();
    });
  });

  describe('Quotation summary display', () => {
    it('should display quotation number', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Quotation Number')).toBeTruthy();
      expect(screen.getByText('QT-2026-001')).toBeTruthy();
    });

    it('should display customer name from customer_name field', () => {
      const quotation = createMockQuotation({ customer_name: 'Direct Customer Name' });
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Direct Customer Name')).toBeTruthy();
    });

    it('should display customer name from customer object when customer_name is not available', () => {
      const quotation = createMockQuotation({ customer_name: undefined });
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Test Customer')).toBeTruthy();
    });

    it('should display N/A when no customer information is available', () => {
      const quotation = createMockQuotation({ customer_name: undefined, customer: undefined });
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('N/A')).toBeTruthy();
    });

    it('should display formatted quotation date', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Quotation Date')).toBeTruthy();
      expect(screen.getByText('Jan 15, 2026')).toBeTruthy();
    });

    it('should display grand total with currency', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Grand Total')).toBeTruthy();
      expect(screen.getByText('USD 1500.00')).toBeTruthy();
    });

    it('should display line items count', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Line Items')).toBeTruthy();
      expect(screen.getByText('2 items')).toBeTruthy();
    });

    it('should display 0 items when line_items is undefined', () => {
      const quotation = createMockQuotation({ line_items: undefined });
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('0 items')).toBeTruthy();
    });
  });

  describe('Form fields', () => {
    it('should display order date field with default value of today', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      expect(orderDateInput).toBeTruthy();
      expect(orderDateInput.type).toBe('date');
      
      // Check that it has today's date as default
      const today = new Date().toISOString().slice(0, 10);
      expect(orderDateInput.value).toBe(today);
    });

    it('should display delivery date field as optional', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const deliveryDateInput = screen.getByLabelText('Delivery Date (Optional)') as HTMLInputElement;
      expect(deliveryDateInput).toBeTruthy();
      expect(deliveryDateInput.type).toBe('date');
      expect(deliveryDateInput.value).toBe('');
    });

    it('should allow changing order date', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      fireEvent.change(orderDateInput, { target: { value: '2026-02-01' } });
      
      expect(orderDateInput.value).toBe('2026-02-01');
    });

    it('should allow changing delivery date', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const deliveryDateInput = screen.getByLabelText('Delivery Date (Optional)') as HTMLInputElement;
      fireEvent.change(deliveryDateInput, { target: { value: '2026-02-15' } });
      
      expect(deliveryDateInput.value).toBe('2026-02-15');
    });

    it('should reset form when dialog opens', () => {
      const quotation = createMockQuotation();
      const { rerender } = renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      // Reopen the dialog
      rerender(
        <QueryClientProvider client={createQueryClient()}>
          <ConvertToSalesOrderDialog
            open={true}
            onOpenChange={mockOnOpenChange}
            quotation={quotation}
            onConvert={mockOnConvert}
            converting={false}
          />
        </QueryClientProvider>
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      const deliveryDateInput = screen.getByLabelText('Delivery Date (Optional)') as HTMLInputElement;
      
      const today = new Date().toISOString().slice(0, 10);
      expect(orderDateInput.value).toBe(today);
      expect(deliveryDateInput.value).toBe('');
    });
  });

  describe('Form submission', () => {
    it('should call onConvert with correct data when form is submitted', async () => {
      const quotation = createMockQuotation();
      mockOnConvert.mockResolvedValue(undefined);
      
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      fireEvent.change(orderDateInput, { target: { value: '2026-02-01' } });

      const submitButton = screen.getByRole('button', { name: /Convert to Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnConvert).toHaveBeenCalledWith('quotation-1', {
          order_date: expect.stringContaining('2026-02-01'),
          delivery_date: undefined,
        });
      });
    });

    it('should call onConvert with delivery date when provided', async () => {
      const quotation = createMockQuotation();
      mockOnConvert.mockResolvedValue(undefined);
      
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      const deliveryDateInput = screen.getByLabelText('Delivery Date (Optional)') as HTMLInputElement;
      
      fireEvent.change(orderDateInput, { target: { value: '2026-02-01' } });
      fireEvent.change(deliveryDateInput, { target: { value: '2026-02-15' } });

      const submitButton = screen.getByRole('button', { name: /Convert to Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnConvert).toHaveBeenCalledWith('quotation-1', {
          order_date: expect.stringContaining('2026-02-01'),
          delivery_date: expect.stringContaining('2026-02-15'),
        });
      });
    });

    it('should show alert when delivery date is before order date', async () => {
      const quotation = createMockQuotation();
      
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      const deliveryDateInput = screen.getByLabelText('Delivery Date (Optional)') as HTMLInputElement;
      
      fireEvent.change(orderDateInput, { target: { value: '2026-02-15' } });
      fireEvent.change(deliveryDateInput, { target: { value: '2026-02-01' } });

      const submitButton = screen.getByRole('button', { name: /Convert to Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Delivery date must be after order date');
        expect(mockOnConvert).not.toHaveBeenCalled();
      });
    });
  });

  describe('Button states', () => {
    it('should display Cancel button', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('should call onOpenChange with false when Cancel button is clicked', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should disable buttons when converting is true', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={true}
        />
      );

      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
      const submitButton = screen.getByText('Converting...') as HTMLButtonElement;

      expect(cancelButton.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    it('should show "Converting..." text when converting is true', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={true}
        />
      );

      expect(screen.getByText('Converting...')).toBeTruthy();
    });

    it('should show "Convert to Sales Order" text when converting is false', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Convert to Sales Order/i });
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Information message', () => {
    it('should display information about what will be copied', () => {
      const quotation = createMockQuotation();
      renderWithQueryClient(
        <ConvertToSalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={quotation}
          onConvert={mockOnConvert}
          converting={false}
        />
      );

      expect(screen.getByText(/The sales order will be created with all line items/)).toBeTruthy();
      expect(screen.getByText(/Customer, currency, and remarks will be copied automatically/)).toBeTruthy();
    });
  });
});
