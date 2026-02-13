import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentDetailDialog } from '../../../../app/components/payments/PaymentDetailDialog';
import type { Payment } from '../../../../app/types/payment';

describe('PaymentDetailDialog', () => {
  const mockPayment: Payment = {
    id: 'pay-1',
    payment_number: 'PAY-2024-001',
    party_id: 'cust-1',
    party_type: 'Customer',
    party_name: 'Acme Corp',
    payment_date: '2024-01-20',
    payment_mode: 'Bank Transfer',
    reference_number: 'TXN-12345',
    currency: 'USD',
    total_amount: 1500,
    allocated_amount: 1200,
    unallocated_amount: 300,
    status: 'Submitted',
    remarks: 'Payment for invoices',
    allocations: [
      {
        id: 'alloc-1',
        invoice_id: 'inv-1',
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-01-15',
        invoice_amount: 1100,
        outstanding_before: 1100,
        allocated_amount: 700,
      },
      {
        id: 'alloc-2',
        invoice_id: 'inv-2',
        invoice_number: 'INV-2024-002',
        invoice_date: '2024-01-18',
        invoice_amount: 800,
        outstanding_before: 800,
        allocated_amount: 500,
      },
    ],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    created_by: 'user-1',
    updated_by: 'user-1',
  };

  const mockHandlers = {
    onOpenChange: jest.fn(),
    onEdit: jest.fn(),
    onViewInvoice: jest.fn(),
  };

  it('renders payment details correctly', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('PAY-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
  });

  it('displays payment amounts correctly', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getAllByText('Allocated Amount').length).toBeGreaterThan(0);
    expect(screen.getByText('Unallocated Amount')).toBeInTheDocument();
    expect(screen.getByText('USD 1500.00')).toBeInTheDocument();
    expect(screen.getByText('USD 1200.00')).toBeInTheDocument();
    expect(screen.getByText('USD 300.00')).toBeInTheDocument();
  });

  it('displays reference number when present', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Reference Number')).toBeInTheDocument();
    expect(screen.getByText('TXN-12345')).toBeInTheDocument();
  });

  it('hides reference number when not present', () => {
    const paymentWithoutRef = { ...mockPayment, reference_number: null };
    render(
      <PaymentDetailDialog
        open={true}
        payment={paymentWithoutRef}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Reference Number')).not.toBeInTheDocument();
  });

  it('displays invoice allocations table', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Invoice Allocations')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-002')).toBeInTheDocument();
  });

  it('displays View buttons for each invoice allocation', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons).toHaveLength(2);
  });

  it('shows Edit button only when status is Draft', () => {
    const draftPayment = { ...mockPayment, status: 'Draft' as const };
    render(
      <PaymentDetailDialog
        open={true}
        payment={draftPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('hides Edit button when status is not Draft', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('displays remarks when present', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Remarks')).toBeInTheDocument();
    expect(screen.getByText('Payment for invoices')).toBeInTheDocument();
  });

  it('hides remarks section when not present', () => {
    const paymentWithoutRemarks = { ...mockPayment, remarks: null };
    render(
      <PaymentDetailDialog
        open={true}
        payment={paymentWithoutRemarks}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText('Remarks')).not.toBeInTheDocument();
  });

  it('displays audit trail timestamps', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });

  it('returns null when payment is null', () => {
    const { container } = render(
      <PaymentDetailDialog
        open={true}
        payment={null}
        {...mockHandlers}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays party type correctly', () => {
    render(
      <PaymentDetailDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('handles Supplier party type', () => {
    const supplierPayment = { ...mockPayment, party_type: 'Supplier' as const };
    render(
      <PaymentDetailDialog
        open={true}
        payment={supplierPayment}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Supplier')).toBeInTheDocument();
  });
});
