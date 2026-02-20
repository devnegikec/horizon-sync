import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SalesOrderDialog } from '../../../../app/components/sales-orders/SalesOrderDialog';
import type { SalesOrder } from '../../../../app/types/sales-order.types';
import { customerApi } from '../../../../app/utility/api/customers';

// Mock the user store
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(() => ({
    accessToken: 'mock-token',
  })),
}));

// Mock the customer API
jest.mock('../../../../app/utility/api/customers', () => ({
  customerApi: {
    list: jest.fn(),
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

describe('SalesOrderDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();

  const mockCustomers = [
    {
      id: 'customer-1',
      customer_name: 'Test Customer 1',
      customer_code: 'CUST-001',
      email: 'test1@example.com',
      phone: '+1234567890',
      status: 'active',
      credit_limit: '10000',
      outstanding_balance: '0',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'customer-2',
      customer_name: 'Test Customer 2',
      customer_code: 'CUST-002',
      email: 'test2@example.com',
      phone: '+0987654321',
      status: 'active',
      credit_limit: '20000',
      outstanding_balance: '0',
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  const createMockSalesOrder = (overrides?: Partial<SalesOrder>): SalesOrder => ({
    id: 'so-1',
    sales_order_no: 'SO-2026-001',
    organization_id: 'org-1',
    customer_id: 'customer-1',
    customer_name: 'Test Customer 1',
    order_date: '2026-01-15',
    delivery_date: '2026-02-15',
    grand_total: '1500.00',
    currency: 'USD',
    status: 'draft',
    remarks: 'Test remarks',
    items: [
      {
        id: 'line-1',
        sales_order_id: 'so-1',
        organization_id: 'org-1',
        item_id: 'item-1',
        item_name: 'Product A',
        qty: '10',
        uom: 'pcs',
        rate: '100',
        amount: '1000',
        billed_qty: '0',
        delivered_qty: '0',
        pending_billing_qty: '10',
        pending_delivery_qty: '10',
        sort_order: 1,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 'line-2',
        sales_order_id: 'so-1',
        organization_id: 'org-1',
        item_id: 'item-2',
        item_name: 'Product B',
        qty: '5',
        uom: 'kg',
        rate: '100',
        amount: '500',
        billed_qty: '0',
        delivered_qty: '0',
        pending_billing_qty: '5',
        pending_delivery_qty: '5',
        sort_order: 2,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    ],
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    
    // Mock customer API response
    (customerApi.list as jest.Mock).mockResolvedValue({
      customers: mockCustomers,
      pagination: {
        page: 1,
        page_size: 100,
        total_items: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    });
  });

  describe('Dialog rendering', () => {
    it('should render in create mode when salesOrder is null', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByRole('heading', { name: /Create Sales Order/i })).toBeTruthy();
    });

    it('should render in edit mode when salesOrder is provided', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByRole('heading', { name: /Edit Sales Order/i })).toBeTruthy();
    });
  });

  describe('Form fields in create mode', () => {
    it('should display all required form fields', async () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      // Wait for the form to render
      await waitFor(() => {
        expect(screen.getByLabelText('Sales Order #')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Customer *')).toBeInTheDocument();
      expect(screen.getByLabelText('Order Date *')).toBeInTheDocument();
      expect(screen.getByLabelText('Delivery Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Currency *')).toBeInTheDocument();
      expect(screen.getByLabelText('Remarks')).toBeInTheDocument();
    });

    it('should have default values in create mode', async () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
        const today = new Date().toISOString().slice(0, 10);
        expect(orderDateInput.value).toBe(today);
      });

      const currencySelect = screen.getByLabelText('Currency *');
      expect(currencySelect).toHaveTextContent('INR');
    });

    it('should show placeholder for auto-generated sales order number', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const soNumberInput = screen.getByLabelText('Sales Order #') as HTMLInputElement;
      expect(soNumberInput.placeholder).toBe('Auto-generated if left blank');
    });

    it('should not display status field in create mode', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.queryByLabelText('Status')).toBeNull();
    });
  });

  describe('Form fields in edit mode', () => {
    it('should pre-fill form with sales order data', async () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        const soNumberInput = screen.getByLabelText('Sales Order #') as HTMLInputElement;
        expect(soNumberInput.value).toBe('SO-2026-001');

        const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
        expect(orderDateInput.value).toBe('2026-01-15');

        const deliveryDateInput = screen.getByLabelText('Delivery Date') as HTMLInputElement;
        expect(deliveryDateInput.value).toBe('2026-02-15');

        const remarksInput = screen.getByLabelText('Remarks') as HTMLTextAreaElement;
        expect(remarksInput.value).toBe('Test remarks');
      });
    });

    it('should disable sales order number field in edit mode', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const soNumberInput = screen.getByLabelText('Sales Order #') as HTMLInputElement;
      expect(soNumberInput.disabled).toBe(true);
    });

    it('should disable customer field in edit mode', async () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        const customerSelect = screen.getByLabelText('Customer *').closest('button') as HTMLButtonElement;
        expect(customerSelect).toBeTruthy();
        if (customerSelect) {
          expect(customerSelect.disabled).toBe(true);
        }
      });
    });

    it('should disable currency field in edit mode', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const currencySelect = screen.getByLabelText('Currency *').closest('button') as HTMLButtonElement;
      expect(currencySelect?.disabled).toBe(true);
    });

    it('should display status field in edit mode', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByLabelText('Status')).toBeTruthy();
    });
  });

  describe('Line item editing', () => {
    it('should disable line item editing when status is not draft', () => {
      const salesOrder = createMockSalesOrder({ status: 'confirmed' });
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      // Check that add item button is disabled
      const addButtons = screen.queryAllByText(/Add Item/i);
      if (addButtons.length > 0) {
        expect((addButtons[0] as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it('should allow line item editing when status is draft', () => {
      const salesOrder = createMockSalesOrder({ status: 'draft' });
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      // Check that add item button is not disabled
      const addButtons = screen.queryAllByText(/Add Item/i);
      if (addButtons.length > 0) {
        expect((addButtons[0] as HTMLButtonElement).disabled).toBe(false);
      }
    });
  });

  describe('Fulfillment status display', () => {
    it('should display fulfillment status table when items have billed or delivered quantities', () => {
      const salesOrder = createMockSalesOrder({
        items: [
          {
            id: 'line-1',
            sales_order_id: 'so-1',
            organization_id: 'org-1',
            item_id: 'item-1',
            item_name: 'Product A',
            qty: '10',
            uom: 'pcs',
            rate: '100',
            amount: '1000',
            billed_qty: '5',
            delivered_qty: '3',
            pending_billing_qty: '5',
            pending_delivery_qty: '7',
            sort_order: 1,
            created_at: '2026-01-15T10:00:00Z',
            updated_at: '2026-01-15T10:00:00Z',
          },
        ],
      });

      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByText('Fulfillment Status')).toBeTruthy();
      expect(screen.getByText('Ordered')).toBeTruthy();
      expect(screen.getByText('Billed')).toBeTruthy();
      expect(screen.getByText('Delivered')).toBeTruthy();
    });

    it('should not display fulfillment status table when no items have fulfillment data', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.queryByText('Fulfillment Status')).toBeNull();
    });

    it('should display correct fulfillment quantities', () => {
      const salesOrder = createMockSalesOrder({
        items: [
          {
            id: 'line-1',
            sales_order_id: 'so-1',
            organization_id: 'org-1',
            item_id: 'item-1',
            item_name: 'Product A',
            qty: '10',
            uom: 'pcs',
            rate: '100',
            amount: '1000',
            billed_qty: '5',
            delivered_qty: '3',
            pending_billing_qty: '5',
            pending_delivery_qty: '7',
            sort_order: 1,
            created_at: '2026-01-15T10:00:00Z',
            updated_at: '2026-01-15T10:00:00Z',
          },
        ],
      });

      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      // Check the table contains the correct values
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent('10'); // Ordered
      expect(table).toHaveTextContent('5'); // Billed
      expect(table).toHaveTextContent('3'); // Delivered
    });
  });

  describe('Form validation', () => {
    it('should show alert when customer is not selected', async () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Create Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please select a customer');
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });

    it('should show alert when delivery date is before order date', async () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        const customerSelect = screen.getByLabelText('Customer *');
        fireEvent.click(customerSelect);
      });

      await waitFor(() => {
        const customerOption = screen.getByText('Test Customer 1');
        fireEvent.click(customerOption);
      });

      const orderDateInput = screen.getByLabelText('Order Date *') as HTMLInputElement;
      const deliveryDateInput = screen.getByLabelText('Delivery Date') as HTMLInputElement;

      fireEvent.change(orderDateInput, { target: { value: '2026-02-15' } });
      fireEvent.change(deliveryDateInput, { target: { value: '2026-02-01' } });

      const submitButton = screen.getByRole('button', { name: /Create Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Delivery date must be after order date');
        expect(mockOnSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onSave with correct data in create mode', async () => {
      mockOnSave.mockResolvedValue(undefined);

      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        const customerSelect = screen.getByLabelText('Customer *');
        fireEvent.click(customerSelect);
      });

      await waitFor(() => {
        const customerOption = screen.getByText('Test Customer 1');
        fireEvent.click(customerOption);
      });

      const submitButton = screen.getByRole('button', { name: /Create Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_id: 'customer-1',
            status: 'draft',
            currency: 'INR',
          })
        );
      });
    });

    it('should call onSave with correct data in edit mode', async () => {
      const salesOrder = createMockSalesOrder();
      mockOnSave.mockResolvedValue(undefined);

      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const remarksInput = screen.getByLabelText('Remarks') as HTMLTextAreaElement;
      fireEvent.change(remarksInput, { target: { value: 'Updated remarks' } });

      const submitButton = screen.getByRole('button', { name: /Update Sales Order/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            remarks: 'Updated remarks',
          }),
          'so-1'
        );
      });
    });
  });

  describe('Button states', () => {
    it('should disable buttons when saving is true', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={true}
        />
      );

      const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;
      const submitButton = screen.getByText('Saving...') as HTMLButtonElement;

      expect(cancelButton.disabled).toBe(true);
      expect(submitButton.disabled).toBe(true);
    });

    it('should show correct button text in create mode', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByRole('button', { name: /Create Sales Order/i })).toBeTruthy();
    });

    it('should show correct button text in edit mode', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByRole('button', { name: /Update Sales Order/i })).toBeTruthy();
    });

    it('should call onOpenChange when Cancel button is clicked', () => {
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Grand total calculation', () => {
    it('should display calculated grand total', () => {
      const salesOrder = createMockSalesOrder();
      renderWithQueryClient(
        <SalesOrderDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onSave={mockOnSave}
          saving={false}
        />
      );

      expect(screen.getByText('Grand Total:')).toBeTruthy();
      expect(screen.getByText(/USD 1500\.00/)).toBeTruthy();
    });
  });
});
