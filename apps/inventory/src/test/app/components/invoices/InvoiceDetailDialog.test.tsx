import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InvoiceDetailDialog } from '../../../../app/components/invoices/InvoiceDetailDialog';
import type { Invoice } from '../../../../app/types/invoice';

describe('InvoiceDetailDialog', () => {
  const mockInvoice: Invoice = {
    id: 'inv-1',
    invoice_number: 'INV-2024-001',
    party_id: 'cust-1',
    party_type: 'Customer',
    party_name: 'Acme Corp',
    posting_date: '2024-01-15',
    due_date: '2024-02-15',
    currency: 'USD',
    invoice_type: 'Sales',
    status: 'Submitted',
    subtotal: 1000,
    total_tax: 100,
    grand_total: 1100,
    paid_amount: 500,
    outstanding_amount: 600,
    remarks: 'Test invoice',
    reference_type: 'Sales Order',
    reference_id: 'so-123',
    line_items: [
      {
        id: 'li-1',
        item_id: 'item-1',
        item_name: 'Widget A',
        description: 'High quality widget',
        quantity: 10,
        uom: 'pcs',
        rate: 100,
        tax_template_id: 'tax-1',
        tax_rate: 10,
        tax_amount: 100,
        amount: 1000,
      },
    ],
    payments: [
      {
        id: 'pay-1',
        invoice_id: 'inv-1',
        invoice_number: 'PAY-2024-001',
        invoice_date: '2024-01-20',
        invoice_amount: 1100,
        outstanding_before: 1100,
        allocated_amount: 500,
      },
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  };

  const mockHandlers = {
    onOpenChange: jest.fn(),
    onEdit: jest.fn(),
    onRecordPayment: jest.fn(),
    onGeneratePDF: jest.fn(),
    onSendEmail: jest.fn(),
    onViewSalesOrder: jest.fn(),
    onViewPayment: jest.fn(),
  };

  it('renders invoice details correctly', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Invoice Details')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
  });

  it('shows Record Payment button when status is Submitted and outstanding > 0', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Record Payment')).toBeInTheDocument();
  });

  it('hides Record Payment button when status is Paid', () => {
    const paidInvoice = { ...mockInvoice, status: 'Paid' as const, outstanding_amount: 0 };
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={paidInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Record Payment')).not.toBeInTheDocument();
  });

  it('shows Edit button only when status is Draft', () => {
    const draftInvoice = { ...mockInvoice, status: 'Draft' as const };
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={draftInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('hides Edit button when status is not Draft', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('displays line items table', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Line Items')).toBeInTheDocument();
    expect(screen.getByText('Widget A')).toBeInTheDocument();
    expect(screen.getByText('High quality widget')).toBeInTheDocument();
  });

  it('displays payment history when payments exist', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText('PAY-2024-001')).toBeInTheDocument();
  });

  it('displays sales order reference link when reference exists', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/Created from Sales Order/)).toBeInTheDocument();
    expect(screen.getByText('View Order')).toBeInTheDocument();
  });

  it('displays totals correctly', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Total Tax')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
    expect(screen.getByText('Paid Amount')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Amount')).toBeInTheDocument();
  });

  it('returns null when invoice is null', () => {
    const { container } = render(
      <InvoiceDetailDialog
        open={true}
        invoice={null}
        {...mockHandlers}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays View button for each payment in payment history', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    // Should have at least one View button for the payment
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('calls onViewPayment when View button is clicked in payment history', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    // Find all buttons with "View" text
    const allButtons = screen.getAllByRole('button');
    const viewButtons = allButtons.filter(btn => btn.textContent?.includes('View') && !btn.textContent?.includes('Order'));
    
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);
    
    expect(mockHandlers.onViewPayment).toHaveBeenCalledWith('pay-1');
  });

  it('calls onViewSalesOrder when View Order button is clicked', () => {
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...mockHandlers}
      />
    );

    const viewOrderButton = screen.getByText('View Order');
    fireEvent.click(viewOrderButton);
    
    expect(mockHandlers.onViewSalesOrder).toHaveBeenCalledWith('so-123');
  });

  it('does not display View Order button when onViewSalesOrder is not provided', () => {
    const handlersWithoutSalesOrder = { ...mockHandlers, onViewSalesOrder: undefined };
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...handlersWithoutSalesOrder}
      />
    );

    expect(screen.queryByText('View Order')).not.toBeInTheDocument();
  });

  it('does not display View buttons in payment history when onViewPayment is not provided', () => {
    const handlersWithoutPayment = { ...mockHandlers, onViewPayment: undefined };
    render(
      <InvoiceDetailDialog
        open={true}
        invoice={mockInvoice}
        {...handlersWithoutPayment}
      />
    );

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    // Should not have View buttons in the payment history table
    const allButtons = screen.getAllByRole('button');
    const viewButtonsInTable = allButtons.filter(btn => btn.textContent?.includes('View') && btn.closest('table'));
    expect(viewButtonsInTable.length).toBe(0);
  });
});
