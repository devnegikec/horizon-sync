import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InvoiceManagement from '../../../app/components/invoices/InvoiceManagement';
import { RevenuePage } from '../../../app/pages/RevenuePage';

// Mock API modules
jest.mock('../../../app/api/invoices');
jest.mock('../../../app/api/payments');

import * as invoicesApi from '../../../app/api/invoices';
import * as paymentsApi from '../../../app/api/payments';

describe('Invoice and Payment Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('31.1 Complete Invoice Workflow', () => {
    it('should create invoice manually', async () => {
      const mockInvoices = [];
      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue(mockInvoices);
      jest.mocked(invoicesApi.createInvoice).mockResolvedValue({
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'draft',
        lineItems: [
          { itemId: 'ITEM-001', description: 'Test Item', quantity: 2, unitPrice: 100, total: 200 }
        ],
        subtotal: 200,
        taxAmount: 20,
        totalAmount: 220,
        amountPaid: 0,
        amountDue: 220,
      });

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText(/create invoice/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create invoice/i));

      // Fill in invoice form
      const customerInput = screen.getByLabelText(/customer/i);
      await user.type(customerInput, 'Test Customer');

      const issueDateInput = screen.getByLabelText(/issue date/i);
      await user.type(issueDateInput, '2024-01-15');

      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2024-02-15');

      // Add line item
      await user.click(screen.getByText(/add item/i));
      
      const itemInput = screen.getByLabelText(/item/i);
      await user.type(itemInput, 'Test Item');

      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      const priceInput = screen.getByLabelText(/unit price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '100');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(invoicesApi.createInvoice).toHaveBeenCalled();
      });
    });

    it('should create invoice from sales order', async () => {
      const mockSalesOrder = {
        id: 'SO-001',
        orderNumber: 'SO-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        lineItems: [
          { itemId: 'ITEM-001', description: 'Test Item', quantity: 2, unitPrice: 100, total: 200 }
        ],
        subtotal: 200,
        taxAmount: 20,
        totalAmount: 220,
      };

      jest.mocked(salesOrdersApi.fetchSalesOrder).mockResolvedValue(mockSalesOrder);
      jest.mocked(invoicesApi.createInvoiceFromSalesOrder).mockResolvedValue({
        id: 'INV-002',
        invoiceNumber: 'INV-002',
        salesOrderId: 'SO-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'draft',
        lineItems: mockSalesOrder.lineItems,
        subtotal: 200,
        taxAmount: 20,
        totalAmount: 220,
        amountPaid: 0,
        amountDue: 220,
      });

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText(/create from sales order/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create from sales order/i));

      // Select sales order
      const salesOrderSelect = screen.getByLabelText(/sales order/i);
      await user.click(salesOrderSelect);
      await user.click(screen.getByText('SO-001'));

      // Submit form
      await user.click(screen.getByRole('button', { name: /create invoice/i }));

      await waitFor(() => {
        expect(invoicesApi.createInvoiceFromSalesOrder).toHaveBeenCalledWith('SO-001');
      });
    });

    it('should edit invoice', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'draft',
        lineItems: [
          { itemId: 'ITEM-001', description: 'Test Item', quantity: 2, unitPrice: 100, total: 200 }
        ],
        subtotal: 200,
        taxAmount: 20,
        totalAmount: 220,
        amountPaid: 0,
        amountDue: 220,
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(invoicesApi.updateInvoice).mockResolvedValue({
        ...mockInvoice,
        customerName: 'Updated Customer',
      });

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update customer name
      const customerInput = screen.getByLabelText(/customer/i);
      await user.clear(customerInput);
      await user.type(customerInput, 'Updated Customer');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(invoicesApi.updateInvoice).toHaveBeenCalled();
      });
    });

    it('should delete invoice', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        status: 'draft',
        totalAmount: 220,
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(invoicesApi.deleteInvoice).mockResolvedValue(undefined);

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(invoicesApi.deleteInvoice).toHaveBeenCalledWith('INV-001');
      });
    });

    it('should transition invoice status from draft to sent', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        status: 'draft',
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(invoicesApi.updateInvoiceStatus).mockResolvedValue({
        ...mockInvoice,
        status: 'sent',
      });

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click status change button
      const statusButton = screen.getByRole('button', { name: /mark as sent/i });
      await user.click(statusButton);

      await waitFor(() => {
        expect(invoicesApi.updateInvoiceStatus).toHaveBeenCalledWith('INV-001', 'sent');
      });
    });

    it('should generate PDF for invoice', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        status: 'sent',
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(invoicesApi.generateInvoicePDF).mockResolvedValue(new Blob(['PDF content']));

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click PDF button
      const pdfButton = screen.getByRole('button', { name: /download pdf/i });
      await user.click(pdfButton);

      await waitFor(() => {
        expect(invoicesApi.generateInvoicePDF).toHaveBeenCalledWith('INV-001');
      });
    });

    it('should send invoice email', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        status: 'sent',
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(invoicesApi.sendInvoiceEmail).mockResolvedValue(undefined);

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click email button
      const emailButton = screen.getByRole('button', { name: /send email/i });
      await user.click(emailButton);

      // Fill in email form
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'customer@example.com');

      // Submit form
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(invoicesApi.sendInvoiceEmail).toHaveBeenCalledWith('INV-001', expect.objectContaining({
          to: 'customer@example.com',
        }));
      });
    });
  });

  describe('31.2 Complete Payment Workflow', () => {
    it('should create payment with allocations', async () => {
      const mockPayments = [];
      const mockInvoices = [
        { id: 'INV-001', invoiceNumber: 'INV-001', amountDue: 220 },
        { id: 'INV-002', invoiceNumber: 'INV-002', amountDue: 150 },
      ];

      jest.mocked(paymentsApi.fetchPayments).mockResolvedValue(mockPayments);
      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue(mockInvoices);
      jest.mocked(paymentsApi.createPayment).mockResolvedValue({
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        paymentDate: '2024-01-20',
        amount: 370,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        allocations: [
          { invoiceId: 'INV-001', invoiceNumber: 'INV-001', amount: 220 },
          { invoiceId: 'INV-002', invoiceNumber: 'INV-002', amount: 150 },
        ],
      });

      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.click(screen.getByText(/payments/i));

      await waitFor(() => {
        expect(screen.getByText(/record payment/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/record payment/i));

      // Fill in payment form
      const customerInput = screen.getByLabelText(/customer/i);
      await user.type(customerInput, 'Test Customer');

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '370');

      const dateInput = screen.getByLabelText(/payment date/i);
      await user.type(dateInput, '2024-01-20');

      const methodSelect = screen.getByLabelText(/payment method/i);
      await user.click(methodSelect);
      await user.click(screen.getByText(/bank transfer/i));

      // Add allocations
      await user.click(screen.getByText(/add allocation/i));
      
      const invoice1Select = screen.getByLabelText(/invoice 1/i);
      await user.click(invoice1Select);
      await user.click(screen.getByText('INV-001'));

      const allocation1Input = screen.getByLabelText(/amount 1/i);
      await user.type(allocation1Input, '220');

      await user.click(screen.getByText(/add allocation/i));
      
      const invoice2Select = screen.getByLabelText(/invoice 2/i);
      await user.click(invoice2Select);
      await user.click(screen.getByText('INV-002'));

      const allocation2Input = screen.getByLabelText(/amount 2/i);
      await user.type(allocation2Input, '150');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalled();
      });
    });

    it('should record payment from invoice', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        amountDue: 220,
      };

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([mockInvoice]);
      jest.mocked(paymentsApi.recordPaymentFromInvoice).mockResolvedValue({
        id: 'PAY-002',
        paymentNumber: 'PAY-002',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        paymentDate: '2024-01-20',
        amount: 220,
        paymentMethod: 'credit_card',
        status: 'completed',
        allocations: [
          { invoiceId: 'INV-001', invoiceNumber: 'INV-001', amount: 220 },
        ],
      });

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click record payment button
      const recordPaymentButton = screen.getByRole('button', { name: /record payment/i });
      await user.click(recordPaymentButton);

      // Fill in payment form
      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '220');

      const methodSelect = screen.getByLabelText(/payment method/i);
      await user.click(methodSelect);
      await user.click(screen.getByText(/credit card/i));

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(paymentsApi.recordPaymentFromInvoice).toHaveBeenCalledWith('INV-001', expect.any(Object));
      });
    });

    it('should edit payment', async () => {
      const mockPayment = {
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        paymentDate: '2024-01-20',
        amount: 220,
        paymentMethod: 'bank_transfer',
        status: 'completed',
      };

      jest.mocked(paymentsApi.fetchPayments).mockResolvedValue([mockPayment]);
      jest.mocked(paymentsApi.updatePayment).mockResolvedValue({
        ...mockPayment,
        amount: 250,
      });

      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.click(screen.getByText(/payments/i));

      await waitFor(() => {
        expect(screen.getByText('PAY-001')).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '250');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(paymentsApi.updatePayment).toHaveBeenCalled();
      });
    });

    it('should delete payment', async () => {
      const mockPayment = {
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
        status: 'completed',
        amount: 220,
      };

      jest.mocked(paymentsApi.fetchPayments).mockResolvedValue([mockPayment]);
      jest.mocked(paymentsApi.deletePayment).mockResolvedValue(undefined);

      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.click(screen.getByText(/payments/i));

      await waitFor(() => {
        expect(screen.getByText('PAY-001')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(paymentsApi.deletePayment).toHaveBeenCalledWith('PAY-001');
      });
    });

    it('should handle multi-invoice allocation', async () => {
      const mockInvoices = [
        { id: 'INV-001', invoiceNumber: 'INV-001', amountDue: 100 },
        { id: 'INV-002', invoiceNumber: 'INV-002', amountDue: 150 },
        { id: 'INV-003', invoiceNumber: 'INV-003', amountDue: 200 },
      ];

      jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue(mockInvoices);
      jest.mocked(paymentsApi.createPayment).mockResolvedValue({
        id: 'PAY-003',
        paymentNumber: 'PAY-003',
        amount: 450,
        allocations: [
          { invoiceId: 'INV-001', amount: 100 },
          { invoiceId: 'INV-002', amount: 150 },
          { invoiceId: 'INV-003', amount: 200 },
        ],
      });

      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.click(screen.getByText(/payments/i));

      await user.click(screen.getByText(/record payment/i));

      // Add multiple allocations
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText(/add allocation/i));
      }

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(paymentsApi.createPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            allocations: expect.arrayContaining([
              expect.objectContaining({ invoiceId: 'INV-001' }),
              expect.objectContaining({ invoiceId: 'INV-002' }),
              expect.objectContaining({ invoiceId: 'INV-003' }),
            ]),
          })
        );
      });
    });
  });

  describe('31.3 Cross-document Navigation', () => {
    it('should navigate from sales order to invoice', async () => {
      const mockSalesOrder = {
        id: 'SO-001',
        orderNumber: 'SO-001',
        invoiceId: 'INV-001',
      };

      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        salesOrderId: 'SO-001',
      };

      jest.mocked(salesOrdersApi.fetchSalesOrder).mockResolvedValue(mockSalesOrder);
      jest.mocked(invoicesApi.fetchInvoice).mockResolvedValue(mockInvoice);

      renderWithProviders(<RevenuePage />);

      // Navigate to sales order
      await user.click(screen.getByText('SO-001'));

      // Click view invoice link
      await waitFor(() => {
        expect(screen.getByText(/view invoice/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/view invoice/i));

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });
    });

    it('should navigate from invoice to payment', async () => {
      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        payments: ['PAY-001'],
      };

      const mockPayment = {
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
      };

      jest.mocked(invoicesApi.fetchInvoice).mockResolvedValue(mockInvoice);
      jest.mocked(paymentsApi.fetchPayment).mockResolvedValue(mockPayment);

      renderWithProviders(<InvoiceManagement />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      // Click view details
      await user.click(screen.getByText('INV-001'));

      // Click view payment link
      await waitFor(() => {
        expect(screen.getByText(/view payment/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/view payment/i));

      await waitFor(() => {
        expect(screen.getByText('PAY-001')).toBeInTheDocument();
      });
    });

    it('should navigate from payment to invoice', async () => {
      const mockPayment = {
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
        allocations: [
          { invoiceId: 'INV-001', invoiceNumber: 'INV-001' },
        ],
      };

      const mockInvoice = {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
      };

      jest.mocked(paymentsApi.fetchPayment).mockResolvedValue(mockPayment);
      jest.mocked(invoicesApi.fetchInvoice).mockResolvedValue(mockInvoice);

      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.click(screen.getByText(/payments/i));

      await waitFor(() => {
        expect(screen.getByText('PAY-001')).toBeInTheDocument();
      });

      // Click view details
      await user.click(screen.getByText('PAY-001'));

      // Click view invoice link
      await waitFor(() => {
        expect(screen.getByText(/INV-001/)).toBeInTheDocument();
      });

      await user.click(screen.getByText('INV-001'));

      await waitFor(() => {
        expect(invoicesApi.fetchInvoice).toHaveBeenCalledWith('INV-001');
      });
    });
  });
});
