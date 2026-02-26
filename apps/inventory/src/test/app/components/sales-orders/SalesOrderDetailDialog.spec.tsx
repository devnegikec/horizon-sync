import { render, screen, fireEvent } from '@testing-library/react';
import { SalesOrderDetailDialog } from '../../../../app/components/sales-orders/SalesOrderDetailDialog';
import type { SalesOrder } from '../../../../app/types/sales-order.types';

describe('SalesOrderDetailDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnCreateInvoice = jest.fn();

  const createMockSalesOrder = (overrides?: Partial<SalesOrder>): SalesOrder => ({
    id: 'so-1',
    sales_order_no: 'SO-2026-001',
    organization_id: 'org-1',
    customer_id: 'customer-1',
    customer_name: 'Test Customer',
    order_date: '2026-01-15',
    delivery_date: '2026-02-15',
    grand_total: '1500.00',
    currency: 'USD',
    status: 'confirmed',
    remarks: 'Test remarks',
    reference_type: 'Quotation',
    reference_id: 'quotation-123',
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
  });

  describe('Dialog rendering', () => {
    it('should not render when salesOrder is null', () => {
      const { container } = render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={null}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open is true and salesOrder is provided', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByRole('heading', { name: /Sales Order Details/i })).toBeTruthy();
    });
  });

  describe('Header information display', () => {
    it('should display sales order number', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Sales Order Number')).toBeTruthy();
      expect(screen.getByText('SO-2026-001')).toBeTruthy();
    });

    it('should display customer name', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Customer')).toBeTruthy();
      expect(screen.getByText('Test Customer')).toBeTruthy();
    });

    it('should display customer_id when customer_name is not available', () => {
      const salesOrder = createMockSalesOrder({ customer_name: undefined });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('customer-1')).toBeTruthy();
    });

    it('should display status badge', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      // StatusBadge component should render the status
      expect(screen.getByText(/confirmed/i)).toBeTruthy();
    });
  });

  describe('Dates and currency display', () => {
    it('should display formatted order date', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Order Date')).toBeTruthy();
      expect(screen.getByText('Jan 15, 2026')).toBeTruthy();
    });

    it('should display formatted delivery date', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Delivery Date')).toBeTruthy();
      expect(screen.getByText('Feb 15, 2026')).toBeTruthy();
    });

    it('should display "Not set" when delivery date is not provided', () => {
      const salesOrder = createMockSalesOrder({ delivery_date: null });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Not set')).toBeTruthy();
    });

    it('should display currency', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Currency')).toBeTruthy();
      expect(screen.getByText('USD')).toBeTruthy();
    });
  });

  describe('Reference display', () => {
    it('should display quotation reference when available', () => {
      const salesOrder = createMockSalesOrder({
        reference_type: 'Quotation',
        reference_id: 'quotation-123',
      });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText(/Created from Quotation/i)).toBeTruthy();
      // Check that the reference ID is displayed (first 8 characters)
      expect(screen.getByText(/quotation/i)).toBeTruthy();
    });

    it('should not display reference when reference_type is not Quotation', () => {
      const salesOrder = createMockSalesOrder({
        reference_type: undefined,
        reference_id: undefined,
      });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText(/Created from Quotation/i)).toBeNull();
    });
  });

  describe('Grand total display', () => {
    it('should display grand total with currency', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Grand Total')).toBeTruthy();
      expect(screen.getByText('USD 1500.00')).toBeTruthy();
    });
  });

  describe('Line items display', () => {
    it('should display line items table with all columns', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Line Items')).toBeTruthy();
      expect(screen.getByText('Item')).toBeTruthy();
      expect(screen.getByText('Qty')).toBeTruthy();
      expect(screen.getByText('UOM')).toBeTruthy();
      expect(screen.getByText('Rate')).toBeTruthy();
      expect(screen.getByText('Amount')).toBeTruthy();
      expect(screen.getByText('Billed')).toBeTruthy();
      expect(screen.getByText('Delivered')).toBeTruthy();
    });

    it('should display line item details', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Product A')).toBeTruthy();
      expect(screen.getByText('Product B')).toBeTruthy();
      expect(screen.getByText('pcs')).toBeTruthy();
      expect(screen.getByText('kg')).toBeTruthy();
    });

    it('should display fulfillment status with progress bars', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      // Check for billed and delivered quantities
      expect(screen.getByText('5 / 10')).toBeTruthy(); // Billed qty for Product A
      expect(screen.getByText('3 / 10')).toBeTruthy(); // Delivered qty for Product A
      expect(screen.getByText('0 / 5')).toBeTruthy(); // Billed qty for Product B
    });

    it('should display "No line items" when items array is empty', () => {
      const salesOrder = createMockSalesOrder({ items: [] });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('No line items')).toBeTruthy();
    });

    it('should display "No line items" when items is undefined', () => {
      const salesOrder = createMockSalesOrder({ items: undefined });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('No line items')).toBeTruthy();
    });
  });

  describe('Remarks display', () => {
    it('should display remarks when available', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Remarks')).toBeTruthy();
      expect(screen.getByText('Test remarks')).toBeTruthy();
    });

    it('should not display remarks section when remarks is null', () => {
      const salesOrder = createMockSalesOrder({ remarks: null });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      // Should not find the Remarks label
      const remarksLabels = screen.queryAllByText('Remarks');
      expect(remarksLabels.length).toBe(0);
    });
  });

  describe('Timestamps display', () => {
    it('should display created timestamp', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText(/Created: Jan 15, 2026/)).toBeTruthy();
    });

    it('should display updated timestamp when available', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText(/Updated: Jan 15, 2026/)).toBeTruthy();
    });
  });

  describe('Button visibility and behavior', () => {
    it('should display Close button', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Close')).toBeTruthy();
    });

    it('should call onOpenChange when Close button is clicked', () => {
      const salesOrder = createMockSalesOrder();
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display Edit button for non-terminal statuses', () => {
      const salesOrder = createMockSalesOrder({ status: 'confirmed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Edit')).toBeTruthy();
    });

    it('should not display Edit button for closed status', () => {
      const salesOrder = createMockSalesOrder({ status: 'closed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should not display Edit button for cancelled status', () => {
      const salesOrder = createMockSalesOrder({ status: 'cancelled' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText('Edit')).toBeNull();
    });

    it('should call onEdit when Edit button is clicked', () => {
      const salesOrder = createMockSalesOrder({ status: 'confirmed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(salesOrder);
    });

    it('should display Create Invoice button for confirmed status', () => {
      const salesOrder = createMockSalesOrder({ status: 'confirmed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Create Invoice')).toBeTruthy();
    });

    it('should display Create Invoice button for partially_delivered status', () => {
      const salesOrder = createMockSalesOrder({ status: 'partially_delivered' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Create Invoice')).toBeTruthy();
    });

    it('should display Create Invoice button for delivered status', () => {
      const salesOrder = createMockSalesOrder({ status: 'delivered' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.getByText('Create Invoice')).toBeTruthy();
    });

    it('should not display Create Invoice button for draft status', () => {
      const salesOrder = createMockSalesOrder({ status: 'draft' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText('Create Invoice')).toBeNull();
    });

    it('should not display Create Invoice button for closed status', () => {
      const salesOrder = createMockSalesOrder({ status: 'closed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText('Create Invoice')).toBeNull();
    });

    it('should not display Create Invoice button for cancelled status', () => {
      const salesOrder = createMockSalesOrder({ status: 'cancelled' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      expect(screen.queryByText('Create Invoice')).toBeNull();
    });

    it('should call onCreateInvoice when Create Invoice button is clicked', () => {
      const salesOrder = createMockSalesOrder({ status: 'confirmed' });
      render(
        <SalesOrderDetailDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          salesOrder={salesOrder}
          onEdit={mockOnEdit}
          onCreateInvoice={mockOnCreateInvoice}
        />
      );

      const createInvoiceButton = screen.getByText('Create Invoice');
      fireEvent.click(createInvoiceButton);

      expect(mockOnCreateInvoice).toHaveBeenCalledWith(salesOrder);
    });
  });
});
