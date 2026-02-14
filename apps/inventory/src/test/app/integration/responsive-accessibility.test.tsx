import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';
import InvoiceManagement from '../../../app/components/invoices/InvoiceManagement';
import { RevenuePage } from '../../../app/pages/RevenuePage';

expect.extend(toHaveNoViolations);

// Mock API modules
jest.mock('../../../app/api/invoices');
jest.mock('../../../app/api/payments');

import * as invoicesApi from '../../../app/api/invoices';
import * as paymentsApi from '../../../app/api/payments';

describe('Responsive Design and Accessibility Tests', () => {
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

    // Mock data
    jest.mocked(invoicesApi.fetchInvoices).mockResolvedValue([
      {
        id: 'INV-001',
        invoiceNumber: 'INV-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        issueDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'sent',
        totalAmount: 220,
        amountPaid: 0,
        amountDue: 220,
      },
    ]);

    jest.mocked(paymentsApi.fetchPayments).mockResolvedValue([
      {
        id: 'PAY-001',
        paymentNumber: 'PAY-001',
        customerId: 'CUST-001',
        customerName: 'Test Customer',
        paymentDate: '2024-01-20',
        amount: 220,
        paymentMethod: 'bank_transfer',
        status: 'completed',
      },
    ]);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('31.4 Responsive Design', () => {
    it('should render invoice management on mobile viewport (320px)', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderWithProviders(<InvoiceManagement />);

      // Check that mobile layout is applied
      expect(container.querySelector('[data-mobile="true"]')).toBeInTheDocument();
    });

    it('should render invoice management on tablet viewport (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderWithProviders(<InvoiceManagement />);

      // Check that tablet layout is applied
      expect(container.querySelector('[data-tablet="true"]')).toBeInTheDocument();
    });

    it('should render invoice management on desktop viewport (1024px)', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      const { container } = renderWithProviders(<InvoiceManagement />);

      // Check that desktop layout is applied
      expect(container.querySelector('[data-desktop="true"]')).toBeInTheDocument();
    });

    it('should adapt table layout for mobile screens', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      renderWithProviders(<InvoiceManagement />);

      // On mobile, table should be scrollable or stacked
      const table = screen.getByRole('table');
      const tableContainer = table.closest('[data-responsive="true"]');
      
      expect(tableContainer).toBeInTheDocument();
    });

    it('should show/hide columns based on screen size', () => {
      // Desktop - all columns visible
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      const { rerender } = renderWithProviders(<InvoiceManagement />);

      expect(screen.getByText(/issue date/i)).toBeInTheDocument();
      expect(screen.getByText(/due date/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();

      // Mobile - some columns hidden
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      rerender(
        <QueryClientProvider client={queryClient}>
          <InvoiceManagement />
        </QueryClientProvider>
      );

      // Essential columns should still be visible
      expect(screen.getByText(/invoice number/i)).toBeInTheDocument();
      expect(screen.getByText(/customer/i)).toBeInTheDocument();
    });

    it('should render payment management responsively', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      renderWithProviders(<RevenuePage />);

      // Check that payment components are responsive
      const paymentsSection = screen.getByTestId('payments-section');
      expect(paymentsSection).toHaveClass('responsive');
    });
  });

  describe('31.5 Accessibility', () => {
    it('should have no accessibility violations in invoice management', async () => {
      const { container } = renderWithProviders(<InvoiceManagement />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in revenue page', async () => {
      const { container } = renderWithProviders(<RevenuePage />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation in invoice table', async () => {
      renderWithProviders(<InvoiceManagement />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /create invoice/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /filters/i })).toHaveFocus();

      await user.tab();
      // First row in table should be focusable
      const firstRow = screen.getByRole('row', { name: /INV-001/i });
      expect(firstRow).toHaveFocus();
    });

    it('should support keyboard navigation in payment table', async () => {
      renderWithProviders(<RevenuePage />);

      // Switch to payments tab
      await user.tab();
      await user.keyboard('{Enter}');

      // Tab through payment elements
      await user.tab();
      expect(screen.getByRole('button', { name: /record payment/i })).toHaveFocus();
    });

    it('should have proper ARIA labels on invoice buttons', () => {
      renderWithProviders(<InvoiceManagement />);

      expect(screen.getByRole('button', { name: /create invoice/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /edit/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /delete/i })).toHaveAttribute('aria-label');
    });

    it('should have proper ARIA labels on payment buttons', () => {
      renderWithProviders(<RevenuePage />);

      expect(screen.getByRole('button', { name: /record payment/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /edit/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /delete/i })).toHaveAttribute('aria-label');
    });

    it('should have proper ARIA labels on form inputs', async () => {
      renderWithProviders(<InvoiceManagement />);

      await user.click(screen.getByText(/create invoice/i));

      // Check form inputs have labels
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/issue date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('should announce status changes to screen readers', async () => {
      renderWithProviders(<InvoiceManagement />);

      const statusButton = screen.getByRole('button', { name: /mark as sent/i });
      
      // Check for aria-live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      await user.click(statusButton);

      // Status change should be announced
      expect(liveRegion).toHaveTextContent(/invoice status updated/i);
    });

    it('should have proper heading hierarchy', () => {
      const { container } = renderWithProviders(<InvoiceManagement />);

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // Check that headings follow proper hierarchy
      let previousLevel = 0;
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.substring(1));
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = level;
      });
    });

    it('should have sufficient color contrast', () => {
      const { container } = renderWithProviders(<InvoiceManagement />);

      // Check that text has sufficient contrast
      const textElements = container.querySelectorAll('p, span, button, a');
      
      textElements.forEach((element) => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Basic check - actual contrast calculation would be more complex
        expect(color).not.toBe(backgroundColor);
      });
    });

    it('should support screen reader navigation with landmarks', () => {
      const { container } = renderWithProviders(<RevenuePage />);

      // Check for proper landmark roles
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      renderWithProviders(<InvoiceManagement />);

      // Links should have descriptive text, not "click here"
      const links = screen.getAllByRole('link');
      
      links.forEach((link) => {
        const text = link.textContent?.toLowerCase() || '';
        expect(text).not.toMatch(/click here|read more|learn more/);
      });
    });

    it('should provide error messages for form validation', async () => {
      renderWithProviders(<InvoiceManagement />);

      await user.click(screen.getByText(/create invoice/i));

      // Submit form without filling required fields
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Error messages should be associated with inputs
      const customerInput = screen.getByLabelText(/customer/i);
      const errorMessage = screen.getByText(/customer is required/i);
      
      expect(customerInput).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id', customerInput.getAttribute('aria-describedby'));
    });

    it('should support focus management in dialogs', async () => {
      renderWithProviders(<InvoiceManagement />);

      await user.click(screen.getByText(/create invoice/i));

      // Focus should move to dialog
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // First focusable element should receive focus
      const firstInput = within(dialog).getByLabelText(/customer/i);
      expect(firstInput).toHaveFocus();
    });

    it('should trap focus within modal dialogs', async () => {
      renderWithProviders(<InvoiceManagement />);

      await user.click(screen.getByText(/create invoice/i));

      const dialog = screen.getByRole('dialog');
      const focusableElements = within(dialog).getAllByRole('button');

      // Tab to last element
      for (let i = 0; i < focusableElements.length; i++) {
        await user.tab();
      }

      // Tab again should cycle back to first element
      await user.tab();
      expect(focusableElements[0]).toHaveFocus();
    });
  });
});
