import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CreateInvoiceDialog } from '../../../../app/components/sales-orders/CreateInvoiceDialog';
import type { SalesOrder } from '../../../../app/types/sales-order.types';

// Mock the user store
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(() => ({
    user: { id: 'user-1', name: 'Test User' },
  })),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
);

describe('CreateInvoiceDialog', () => {
  const mockSalesOrder: SalesOrder = {
    id: 'so-1',
    sales_order_no: 'SO-2026-001',
    customer_id: 'cust-1',
    customer_name: 'Acme Corp',
    order_date: '2026-02-01',
    delivery_date: '2026-02-15',
    currency: 'USD',
    status: 'confirmed',
    grand_total: '1500.00',
    items: [
      {
        id: 'item-1',
        item_id: 'prod-1',
        item_name: 'Product A',
        qty: '100.00',
        uom: 'pcs',
        rate: '10.00',
        amount: '1000.00',
        billed_qty: '30.00',
        delivered_qty: '0.00',
      },
      {
        id: 'item-2',
        item_id: 'prod-2',
        item_name: 'Product B',
        qty: '50.00',
        uom: 'pcs',
        rate: '10.00',
        amount: '500.00',
        billed_qty: '50.00',
        delivered_qty: '0.00',
      },
    ],
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  };

  const mockOnOpenChange = jest.fn();
  const mockOnCreateInvoice = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with sales order summary', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    expect(screen.getByText('Create Invoice from Sales Order')).toBeInTheDocument();
    expect(screen.getByText('SO-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('should display line items with quantity information', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Check table headers
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Ordered')).toBeInTheDocument();
    expect(screen.getByText('Already Billed')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Qty to Bill')).toBeInTheDocument();

    // Check line item data
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  it('should calculate available quantity correctly', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Product A: ordered 100, billed 30, available 70
    const rows = screen.getAllByRole('row');
    const productARow = rows.find(row => row.textContent?.includes('Product A'));
    expect(productARow).toHaveTextContent('100'); // Ordered
    expect(productARow).toHaveTextContent('30'); // Already Billed
    expect(productARow).toHaveTextContent('70'); // Available

    // Product B: ordered 50, billed 50, available 0
    const productBRow = rows.find(row => row.textContent?.includes('Product B'));
    expect(productBRow).toHaveTextContent('50'); // Ordered
    expect(productBRow).toHaveTextContent('50'); // Already Billed
    expect(productBRow).toHaveTextContent('0'); // Available
  });

  it('should initialize qty_to_bill with available quantity', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Product A should have qty_to_bill = 70 (available)
    expect(inputs[0]).toHaveValue(70);
    
    // Product B should have qty_to_bill = 0 (fully billed)
    expect(inputs[1]).toHaveValue(0);
  });

  it('should calculate invoice total based on qty_to_bill', async () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Initial total: Product A (70 * 10) + Product B (0 * 10) = 700
    await waitFor(() => {
      expect(screen.getByText(/700\.00/)).toBeInTheDocument();
    });
  });

  it('should update invoice total when qty_to_bill changes', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Change Product A qty_to_bill to 50
    await user.clear(inputs[0]);
    await user.type(inputs[0], '50');

    // New total: 50 * 10 = 500
    await waitFor(() => {
      expect(screen.getByText(/500\.00/)).toBeInTheDocument();
    });
  });

  it('should show validation error when qty_to_bill exceeds available', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Try to bill more than available (70)
    await user.clear(inputs[0]);
    await user.type(inputs[0], '100');

    await waitFor(() => {
      expect(screen.getByText('Exceeds available')).toBeInTheDocument();
    });
  });

  it('should disable submit button when validation error exists', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    const submitButton = screen.getByRole('button', { name: /Create Invoice/i });

    // Initially enabled (has valid items)
    expect(submitButton).not.toBeDisabled();

    // Enter invalid quantity
    await user.clear(inputs[0]);
    await user.type(inputs[0], '100');

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should disable submit button when no items have positive quantity', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    const submitButton = screen.getByRole('button', { name: /Create Invoice/i });

    // Set all quantities to zero
    await user.clear(inputs[0]);
    await user.type(inputs[0], '0');

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should disable input when available quantity is zero', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Product B has 0 available, should be disabled
    expect(inputs[1]).toBeDisabled();
  });

  it('should call onCreateInvoice with correct data on submit', async () => {
    const user = userEvent.setup();
    mockOnCreateInvoice.mockResolvedValue(undefined);
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Set Product A qty_to_bill to 50
    await user.clear(inputs[0]);
    await user.type(inputs[0], '50');

    const submitButton = screen.getByRole('button', { name: /Create Invoice/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreateInvoice).toHaveBeenCalledWith('so-1', {
        items: [
          {
            item_id: 'prod-1',
            qty_to_bill: 50,
          },
        ],
      });
    });
  });

  it('should only include items with positive qty_to_bill in invoice', async () => {
    const user = userEvent.setup();
    mockOnCreateInvoice.mockResolvedValue(undefined);
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const submitButton = screen.getByRole('button', { name: /Create Invoice/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnCreateInvoice).toHaveBeenCalledWith('so-1', {
        items: [
          {
            item_id: 'prod-1',
            qty_to_bill: 70, // Only Product A with available qty
          },
        ],
      });
    });
  });

  it('should show alert when trying to submit with validation errors', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Enter invalid quantity
    await user.clear(inputs[0]);
    await user.type(inputs[0], '100');

    const form = screen.getByRole('button', { name: /Create Invoice/i }).closest('form');
    if (form) {
      await user.click(screen.getByRole('button', { name: /Create Invoice/i }));
    }

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Quantity to bill cannot exceed available quantity');
    });

    alertSpy.mockRestore();
  });

  it('should show alert when trying to submit without valid items', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Set all quantities to zero
    await user.clear(inputs[0]);
    await user.type(inputs[0], '0');

    const form = screen.getByRole('button', { name: /Create Invoice/i }).closest('form');
    if (form) {
      await user.click(screen.getByRole('button', { name: /Create Invoice/i }));
    }

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('At least one line item must have a quantity to bill');
    });

    alertSpy.mockRestore();
  });

  it('should disable buttons when creating', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={true}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: /Creating Invoice/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
  });

  it('should call onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when salesOrder is null', () => {
    const { container } = render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={null}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    expect(container.firstChild).toBeNull();
  });

  it('should reset line items when dialog opens with new sales order', () => {
    const { rerender } = render(
      <CreateInvoiceDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Open dialog
    rerender(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(70); // Product A available
    expect(inputs[1]).toHaveValue(0);  // Product B available
  });

  it('should display order total in summary', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    expect(screen.getByText(/USD 1500\.00/)).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Check that order date is displayed (format: Feb 1, 2026)
    expect(screen.getByText(/Feb.*1.*2026/)).toBeInTheDocument();
  });

  it('should display rate and calculate line amount correctly', () => {
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    // Product A: qty_to_bill=70, rate=10, amount=700
    const rows = screen.getAllByRole('row');
    const productARow = rows.find(row => row.textContent?.includes('Product A'));
    expect(productARow).toHaveTextContent('10.00'); // Rate
    expect(productARow).toHaveTextContent('700.00'); // Amount
  });

  it('should handle decimal quantities correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Enter decimal quantity
    await user.clear(inputs[0]);
    await user.type(inputs[0], '25.5');

    // Check calculated amount: 25.5 * 10 = 255
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      const productARow = rows.find(row => row.textContent?.includes('Product A'));
      expect(productARow).toHaveTextContent('255.00');
    });
  });

  it('should highlight row with validation error', async () => {
    const user = userEvent.setup();
    
    render(
      <CreateInvoiceDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        salesOrder={mockSalesOrder}
        onCreateInvoice={mockOnCreateInvoice}
        creating={false}
      />,
      { wrapper }
    );

    const inputs = screen.getAllByRole('spinbutton');
    
    // Enter invalid quantity
    await user.clear(inputs[0]);
    await user.type(inputs[0], '100');

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      const productARow = rows.find(row => row.textContent?.includes('Product A'));
      // Check for error styling class
      expect(productARow).toHaveClass('bg-red-50');
    });
  });
});
