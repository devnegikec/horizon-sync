import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import { InvoiceDetailDialog } from '@horizon-sync/ui';
import type { Invoice } from '@horizon-sync/ui';

describe('InvoiceDetailDialog', () => {
  const mockInvoice: Invoice = {
    id: 'inv-1',
    organization_id: 'org-1',
    invoice_no: 'INV-2024-001',
    invoice_type: 'sales',
    party_id: 'cust-1',
    party_type: 'Customer',
    party_name: 'Acme Corp',
    posting_date: '2024-01-15',
    due_date: '2024-02-15',
    status: 'pending',
    grand_total: 1100,
    outstanding_amount: 600,
    currency: 'USD',
    remarks: 'Test invoice',
    reference_type: 'Sales Order',
    reference_id: 'so-123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    line_items: [
      {
        id: 'li-1',
        invoice_id: 'inv-1',
        item_id: 'item-1',
        item_name: 'Widget A',
        quantity: 10,
        unit_price: 100,
        amount: 1000,
        total_amount: 1100,
        tax_amount: 100,
      },
    ],
  };

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    invoice: mockInvoice,
  };

  it('returns null when invoice is null', () => {
    const { container } = render(
      <InvoiceDetailDialog {...defaultProps} invoice={null} />
    );
    // Dialog renders nothing when invoice is null
    expect(container.innerHTML).toBe('');
  });

  it('renders invoice number in the dialog', () => {
    render(<InvoiceDetailDialog {...defaultProps} />);
    expect(screen.getByText('INV-2024-001')).toBeTruthy();
  });

  it('renders PDF action buttons when callbacks provided', () => {
    render(
      <InvoiceDetailDialog
        {...defaultProps}
        onDownloadPDF={jest.fn()}
        onPreviewPDF={jest.fn()}
        onSendEmail={jest.fn()}
      />
    );
    expect(screen.getByText('Download PDF')).toBeTruthy();
    expect(screen.getByText('Preview PDF')).toBeTruthy();
    expect(screen.getByText('Send Email')).toBeTruthy();
  });

  it('does not render PDF buttons when no callbacks provided', () => {
    render(<InvoiceDetailDialog {...defaultProps} />);
    expect(screen.queryByText('Download PDF')).toBeNull();
    expect(screen.queryByText('Preview PDF')).toBeNull();
    expect(screen.queryByText('Send Email')).toBeNull();
  });

  it('renders Close button', () => {
    render(<InvoiceDetailDialog {...defaultProps} />);
    expect(screen.getByText('Close')).toBeTruthy();
  });
});
