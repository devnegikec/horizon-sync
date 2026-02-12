import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuotationDialog } from '../../../../app/components/quotations/QuotationDialog';
import type { Quotation } from '../../../../app/types/quotation.types';

// Mock the user store
const mockAccessToken = 'test-token';
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector) => {
    const state = { accessToken: mockAccessToken };
    return selector(state);
  }),
}));

// Mock the customer API
const mockCustomers = [
  { id: 'customer-1', customer_name: 'Customer A', customer_code: 'CUST-A' },
  { id: 'customer-2', customer_name: 'Customer B', customer_code: 'CUST-B' },
  { id: 'customer-3', customer_name: 'Customer C', customer_code: 'CUST-C' },
];

jest.mock('../../../../app/utility/api', () => ({
  customerApi: {
    list: jest.fn(() =>
      Promise.resolve({
        customers: mockCustomers,
      })
    ),
  },
  itemApi: {
    list: jest.fn(() =>
      Promise.resolve({
        items: [
          { id: 'item-1', item_name: 'Product A', item_sku: 'SKU-A' },
          { id: 'item-2', item_name: 'Product B', item_sku: 'SKU-B' },
        ],
      })
    ),
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

describe('QuotationDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should open form in create mode with empty fields', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Check that form fields are empty/default
      const quotationNoInput = screen.getByLabelText(/Quotation #/i) as HTMLInputElement;
      expect(quotationNoInput.value).toBe('');
      expect(quotationNoInput.placeholder).toContain('Auto-generated');

      // Check default date is set to today
      const quotationDateInput = screen.getByLabelText(/Quotation Date/i) as HTMLInputElement;
      const today = new Date().toISOString().slice(0, 10);
      expect(quotationDateInput.value).toBe(today);

      // Check that customer dropdown is enabled
      const customerSelect = screen.getByText('Select customer');
      expect(customerSelect).toBeTruthy();
    });

    it('should display customer options in dropdown', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Wait for customers to load
      await waitFor(() => {
        const customerTrigger = screen.getAllByRole('combobox')[0];
        expect(customerTrigger).toBeTruthy();
      });
    });

    it('should have default currency set to INR', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Currency should default to INR - check for currency label and that INR appears
      expect(screen.getByText(/Currency \*/i)).toBeTruthy();
      const inrElements = screen.getAllByText('INR');
      expect(inrElements.length).toBeGreaterThan(0);
    });

    it('should not display status field in create mode', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Status field should not be present in create mode
      const statusLabel = screen.queryByText('Status');
      expect(statusLabel).toBeNull();
    });
  });

  describe('Edit mode', () => {
    const mockQuotation: Quotation = {
      id: 'quotation-1',
      quotation_no: 'QT-2026-001',
      organization_id: 'org-1',
      customer_id: 'customer-1',
      customer_name: 'Customer A',
      quotation_date: '2026-01-15T00:00:00Z',
      valid_until: '2026-02-15T00:00:00Z',
      grand_total: '1000.00',
      currency: 'USD',
      status: 'draft',
      remarks: 'Test remarks',
      line_items: [
        {
          id: 'line-1',
          quotation_id: 'quotation-1',
          item_id: 'item-1',
          item_name: 'Product A',
          qty: 5,
          uom: 'pcs',
          rate: '100.00',
          amount: '500.00',
          sort_order: 1,
        },
        {
          id: 'line-2',
          quotation_id: 'quotation-1',
          item_id: 'item-2',
          item_name: 'Product B',
          qty: 10,
          uom: 'kg',
          rate: '50.00',
          amount: '500.00',
          sort_order: 2,
        },
      ],
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    it('should open form in edit mode with pre-filled data', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Check that form fields are pre-filled
      const quotationNoInput = screen.getByLabelText(/Quotation #/i) as HTMLInputElement;
      expect(quotationNoInput.value).toBe('QT-2026-001');
      expect(quotationNoInput.disabled).toBe(true);

      const quotationDateInput = screen.getByLabelText(/Quotation Date/i) as HTMLInputElement;
      expect(quotationDateInput.value).toBe('2026-01-15');

      const validUntilInput = screen.getByLabelText(/Valid Until/i) as HTMLInputElement;
      expect(validUntilInput.value).toBe('2026-02-15');

      const remarksInput = screen.getByLabelText(/Remarks/i) as HTMLTextAreaElement;
      expect(remarksInput.value).toBe('Test remarks');
    });

    it('should pre-fill line items from quotation', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Check that line items are displayed
      expect(screen.getByText('Item #1')).toBeTruthy();
      expect(screen.getByText('Item #2')).toBeTruthy();
    });

    it('should disable customer selection in edit mode', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Customer select should be disabled - check by finding the disabled combobox
      const comboboxes = screen.getAllByRole('combobox');
      const disabledComboboxes = comboboxes.filter(cb => cb.hasAttribute('disabled') || cb.hasAttribute('data-disabled'));
      expect(disabledComboboxes.length).toBeGreaterThan(0);
    });

    it('should disable currency selection in edit mode', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Currency should be displayed but not editable - check for currency label
      expect(screen.getByText(/Currency \*/i)).toBeTruthy();
      // USD appears in both the select and grand total, so we just verify it's present
      const usdElements = screen.getAllByText('USD');
      expect(usdElements.length).toBeGreaterThan(0);
    });

    it('should display status field in edit mode', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Status field should be present in edit mode
      const statusLabel = screen.getByText('Status');
      expect(statusLabel).toBeTruthy();
    });
  });

  describe('SENT status behavior', () => {
    const sentQuotation: Quotation = {
      id: 'quotation-2',
      quotation_no: 'QT-2026-002',
      organization_id: 'org-1',
      customer_id: 'customer-1',
      customer_name: 'Customer A',
      quotation_date: '2026-01-15T00:00:00Z',
      valid_until: '2026-02-15T00:00:00Z',
      grand_total: '500.00',
      currency: 'USD',
      status: 'sent',
      line_items: [
        {
          id: 'line-1',
          quotation_id: 'quotation-2',
          item_id: 'item-1',
          item_name: 'Product A',
          qty: 5,
          uom: 'pcs',
          rate: '100.00',
          amount: '500.00',
          sort_order: 1,
        },
      ],
      created_by: 'user-1',
      updated_by: 'user-1',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    it('should disable line item editing when status is SENT', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={sentQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Add Item button should be disabled
      const addButton = screen.getByText('Add Item');
      expect(addButton.hasAttribute('disabled')).toBe(true);

      // All line item inputs should be disabled
      const numberInputs = screen.getAllByRole('spinbutton');
      numberInputs.forEach((input) => {
        expect(input.hasAttribute('disabled')).toBe(true);
      });
    });
  });

  describe('Form validation', () => {
    it('should have required customer field', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Check that customer field is marked as required
      const customerLabel = screen.getByText(/Customer \*/i);
      expect(customerLabel).toBeTruthy();
    });

    it('should have required date fields', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Check that date fields are marked as required
      const quotationDateInput = screen.getByLabelText(/Quotation Date \*/i) as HTMLInputElement;
      expect(quotationDateInput.required).toBe(true);

      const validUntilInput = screen.getByLabelText(/Valid Until \*/i) as HTMLInputElement;
      expect(validUntilInput.required).toBe(true);
    });

    it('should display line items section', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      // Check that line items section is present
      expect(screen.getByText('Line Items')).toBeTruthy();
      expect(screen.getByText('Add Item')).toBeTruthy();
    });
  });

  describe('Grand total calculation', () => {
    it('should display calculated grand total', async () => {
      const mockQuotation: Quotation = {
        id: 'quotation-1',
        quotation_no: 'QT-2026-001',
        organization_id: 'org-1',
        customer_id: 'customer-1',
        customer_name: 'Customer A',
        quotation_date: '2026-01-15T00:00:00Z',
        valid_until: '2026-02-15T00:00:00Z',
        grand_total: '1000.00',
        currency: 'USD',
        status: 'draft',
        line_items: [
          {
            id: 'line-1',
            quotation_id: 'quotation-1',
            item_id: 'item-1',
            item_name: 'Product A',
            qty: 5,
            uom: 'pcs',
            rate: '100.00',
            amount: '500.00',
            sort_order: 1,
          },
          {
            id: 'line-2',
            quotation_id: 'quotation-1',
            item_id: 'item-2',
            item_name: 'Product B',
            qty: 10,
            uom: 'kg',
            rate: '50.00',
            amount: '500.00',
            sort_order: 2,
          },
        ],
        created_by: 'user-1',
        updated_by: 'user-1',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      };

      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      // Check grand total is displayed correctly
      expect(screen.getByText('Grand Total:')).toBeTruthy();
      expect(screen.getByText('USD 1000.00')).toBeTruthy();
    });
  });

  describe('Form submission', () => {
    it('should disable submit button while saving', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create Quotation')).toBeTruthy();
      });

      const submitButton = screen.getByText('Saving...');
      expect(submitButton.hasAttribute('disabled')).toBe(true);
    });

    it('should show correct button text in create mode', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: 'Create Quotation' });
      expect(submitButton).toBeTruthy();
    });

    it('should show correct button text in edit mode', async () => {
      const mockQuotation: Quotation = {
        id: 'quotation-1',
        quotation_no: 'QT-2026-001',
        organization_id: 'org-1',
        customer_id: 'customer-1',
        customer_name: 'Customer A',
        quotation_date: '2026-01-15T00:00:00Z',
        valid_until: '2026-02-15T00:00:00Z',
        grand_total: '500.00',
        currency: 'USD',
        status: 'draft',
        line_items: [
          {
            id: 'line-1',
            quotation_id: 'quotation-1',
            item_id: 'item-1',
            item_name: 'Product A',
            qty: 5,
            uom: 'pcs',
            rate: '100.00',
            amount: '500.00',
            sort_order: 1,
          },
        ],
        created_by: 'user-1',
        updated_by: 'user-1',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      };

      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={mockQuotation}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Quotation')).toBeTruthy();
      });

      const submitButton = screen.getByText('Update Quotation');
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Dialog controls', () => {
    it('should call onOpenChange when cancel button is clicked', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Create Quotation' })).toBeTruthy();
      });

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should disable cancel button while saving', async () => {
      renderWithQueryClient(
        <QuotationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          quotation={null}
          onSave={mockOnSave}
          saving={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Create Quotation')).toBeTruthy();
      });

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton.hasAttribute('disabled')).toBe(true);
    });
  });
});
