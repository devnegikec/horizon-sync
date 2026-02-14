import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentDialog } from '../../../../app/components/payments/PaymentDialog';
import type { Payment, PaymentFormData } from '../../../../app/types/payment';

// Mock the store
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(() => ({
    accessToken: 'mock-token',
  })),
}));

// Mock the customer API
jest.mock('../../../../app/utility/api', () => ({
  customerApi: {
    list: jest.fn(() => Promise.resolve({
      customers: [
        { id: 'cust-1', customer_name: 'Acme Corp' },
        { id: 'cust-2', customer_name: 'Tech Solutions' },
      ],
      pagination: {
        page: 1,
        page_size: 100,
        total_items: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    })),
  },
}));

// Mock the payment API
jest.mock('../../../../app/api/payments', () => ({
  paymentApi: {
    getOutstandingInvoices: jest.fn(() => Promise.resolve([
      {
        id: 'inv-1',
        invoice_number: 'INV-2024-001',
        posting_date: '2024-01-15',
        due_date: '2024-02-15',
        grand_total: 1100,
        paid_amount: 0,
        outstanding_amount: 1100,
        currency: 'INR',
      },
    ])),
  },
}));

describe('PaymentDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const mockHandlers = {
    onOpenChange: jest.fn(),
    onSave: jest.fn(() => Promise.resolve()),
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders create payment dialog', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create Payment' })).toBeInTheDocument();
  });

  it('renders edit payment dialog with payment data', () => {
    const mockPayment: Payment = {
      id: 'pay-1',
      payment_number: 'PAY-2024-001',
      party_id: 'cust-1',
      party_type: 'Customer',
      party_name: 'Acme Corp',
      payment_date: '2024-01-20',
      payment_mode: 'Bank Transfer',
      reference_number: 'TXN-12345',
      currency: 'INR',
      total_amount: 1500,
      allocated_amount: 1200,
      unallocated_amount: 300,
      status: 'Draft',
      remarks: 'Test payment',
      allocations: [],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1',
    };

    renderWithProviders(
      <PaymentDialog
        open={true}
        payment={mockPayment}
        {...mockHandlers}
        saving={false}
      />
    );

    expect(screen.getByText('Edit Payment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PAY-2024-001')).toBeInTheDocument();
  });

  it('displays all required form fields', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    expect(screen.getByText(/Party Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Date/)).toBeInTheDocument();
    expect(screen.getByText(/Payment Mode/)).toBeInTheDocument();
    expect(screen.getByText(/Currency/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Amount/)).toBeInTheDocument();
  });

  it('displays payment allocation table', async () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Invoice Allocations')).toBeInTheDocument();
    });
  });

  it('shows allocated and unallocated amounts', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    expect(screen.getByText('Allocated:')).toBeInTheDocument();
    expect(screen.getByText('Unallocated:')).toBeInTheDocument();
  });

  it('disables submit button when saving', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={true}
      />
    );

    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('displays cancel and submit buttons', () => {
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Payment' })).toBeInTheDocument();
  });

  it('pre-fills form when preSelectedInvoice is provided', () => {
    const mockInvoice = {
      id: 'inv-1',
      invoice_number: 'INV-2024-001',
      party_id: 'cust-1',
      party_type: 'Customer' as const,
      party_name: 'Acme Corp',
      posting_date: '2024-01-15',
      due_date: '2024-02-15',
      currency: 'INR',
      invoice_type: 'Sales' as const,
      status: 'Submitted' as const,
      subtotal: 1000,
      total_tax: 100,
      grand_total: 1100,
      paid_amount: 0,
      outstanding_amount: 1100,
      remarks: null,
      reference_type: null,
      reference_id: null,
      line_items: [],
      payments: [],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      created_by: 'user-1',
      updated_by: 'user-1',
    };

    renderWithProviders(
      <PaymentDialog
        open={true}
        preSelectedInvoice={mockInvoice}
        {...mockHandlers}
        saving={false}
      />
    );

    // Check that total amount is pre-filled with outstanding amount
    const totalAmountInput = screen.getByLabelText(/Total Amount/) as HTMLInputElement;
    expect(totalAmountInput.value).toBe('1100');
  });

  it('shows validation error when party is not selected', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <PaymentDialog
        open={true}
        {...mockHandlers}
        saving={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Create Payment' });
    await user.click(submitButton);

    // Alert should be shown (in real implementation, this would be a toast)
    // For now, we just verify the form doesn't submit
    expect(mockHandlers.onSave).not.toHaveBeenCalled();
  });
});
