import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { useInvoiceManagement } from '../../../app/hooks/useInvoiceManagement';
import { invoiceApi } from '../../../app/api/invoices';
import type { InvoiceListResponse } from '../../../app/types/invoice';

// Mock the dependencies
jest.mock('../../../app/api/invoices');
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn(() => ({
    accessToken: 'test-token',
  })),
}));
jest.mock('@horizon-sync/ui/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

const mockedInvoiceApi = invoiceApi as jest.Mocked<typeof invoiceApi>;

describe('useInvoiceManagement - Overdue Detection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should detect and mark overdue invoices', async () => {
    // Create a date in the past (overdue)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastDateString = pastDate.toISOString().split('T')[0];

    // Create a date in the future (not overdue)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDateString = futureDate.toISOString().split('T')[0];

    const mockResponse: InvoiceListResponse = {
      invoices: [
        {
          id: '1',
          invoice_number: 'INV-2024-0001',
          party_id: 'customer-1',
          party_type: 'Customer',
          party_name: 'Test Customer',
          posting_date: pastDateString,
          due_date: pastDateString, // Past due date
          currency: 'USD',
          invoice_type: 'Sales',
          status: 'Submitted', // Should become Overdue
          subtotal: 1000,
          total_tax: 100,
          grand_total: 1100,
          paid_amount: 0,
          outstanding_amount: 1100, // Has outstanding amount
          remarks: null,
          reference_type: null,
          reference_id: null,
          line_items: [],
          payments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-1',
          updated_by: 'user-1',
        },
        {
          id: '2',
          invoice_number: 'INV-2024-0002',
          party_id: 'customer-2',
          party_type: 'Customer',
          party_name: 'Test Customer 2',
          posting_date: futureDateString,
          due_date: futureDateString, // Future due date
          currency: 'USD',
          invoice_type: 'Sales',
          status: 'Submitted', // Should remain Submitted
          subtotal: 2000,
          total_tax: 200,
          grand_total: 2200,
          paid_amount: 0,
          outstanding_amount: 2200,
          remarks: null,
          reference_type: null,
          reference_id: null,
          line_items: [],
          payments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-1',
          updated_by: 'user-1',
        },
        {
          id: '3',
          invoice_number: 'INV-2024-0003',
          party_id: 'customer-3',
          party_type: 'Customer',
          party_name: 'Test Customer 3',
          posting_date: pastDateString,
          due_date: pastDateString, // Past due date
          currency: 'USD',
          invoice_type: 'Sales',
          status: 'Submitted',
          subtotal: 3000,
          total_tax: 300,
          grand_total: 3300,
          paid_amount: 3300,
          outstanding_amount: 0, // No outstanding amount - should NOT become overdue
          remarks: null,
          reference_type: null,
          reference_id: null,
          line_items: [],
          payments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-1',
          updated_by: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 3,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };

    mockedInvoiceApi.list.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useInvoiceManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that the first invoice is marked as Overdue
    expect(result.current.invoices[0].status).toBe('Overdue');
    
    // Check that the second invoice remains Submitted (future due date)
    expect(result.current.invoices[1].status).toBe('Submitted');
    
    // Check that the third invoice remains Submitted (no outstanding amount)
    expect(result.current.invoices[2].status).toBe('Submitted');

    // Check that stats reflect the overdue count
    expect(result.current.stats.overdue).toBe(1);
    expect(result.current.stats.submitted).toBe(2);
  });

  it('should not mark paid invoices as overdue', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastDateString = pastDate.toISOString().split('T')[0];

    const mockResponse: InvoiceListResponse = {
      invoices: [
        {
          id: '1',
          invoice_number: 'INV-2024-0001',
          party_id: 'customer-1',
          party_type: 'Customer',
          party_name: 'Test Customer',
          posting_date: pastDateString,
          due_date: pastDateString,
          currency: 'USD',
          invoice_type: 'Sales',
          status: 'Paid', // Already paid
          subtotal: 1000,
          total_tax: 100,
          grand_total: 1100,
          paid_amount: 1100,
          outstanding_amount: 0,
          remarks: null,
          reference_type: null,
          reference_id: null,
          line_items: [],
          payments: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-1',
          updated_by: 'user-1',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };

    mockedInvoiceApi.list.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useInvoiceManagement(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that the paid invoice is NOT marked as Overdue
    expect(result.current.invoices[0].status).toBe('Paid');
    expect(result.current.stats.overdue).toBe(0);
    expect(result.current.stats.paid).toBe(1);
  });
});
