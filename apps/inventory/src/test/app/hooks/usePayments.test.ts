import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePayments } from '../../../app/hooks/usePayments';
import { paymentApi } from '../../../app/utility/api';
import type { PaymentsResponse } from '../../../app/types/payment.types';

vi.mock('@horizon-sync/store', () => ({
  useUserStore: vi.fn((selector) => selector({ accessToken: 'test-token' })),
}));

vi.mock('../../../app/utility/api', () => ({
  paymentApi: {
    fetchPayments: vi.fn(),
  },
}));

describe('usePayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch payments on mount', async () => {
    const mockResponse: PaymentsResponse = {
      payment_entries: [
        {
          id: '1',
          receipt_number: 'PAY-001',
          payment_type: 'Customer_Payment',
          payment_date: '2026-02-20',
          amount: 1000,
          currency_code: 'USD',
          payment_mode: 'Cash',
          status: 'Draft',
          party_id: 'cust-1',
          party_name: 'Test Customer',
          organization_id: 'org-1',
          unallocated_amount: 1000,
          created_at: '2026-02-20T10:00:00Z',
          updated_at: '2026-02-20T10:00:00Z',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1,
      },
    };

    vi.mocked(paymentApi.fetchPayments).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePayments());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.payments).toHaveLength(1);
    expect(result.current.payments[0].receipt_number).toBe('PAY-001');
    expect(result.current.totalCount).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(paymentApi.fetchPayments).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePayments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.payments).toHaveLength(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('should apply initial filters', async () => {
    const mockResponse: PaymentsResponse = {
      payment_entries: [],
      pagination: {
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      },
    };

    vi.mocked(paymentApi.fetchPayments).mockResolvedValue(mockResponse);

    const initialFilters = {
      status: 'Confirmed',
      page_size: 20,
    };

    const { result } = renderHook(() => usePayments(initialFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.filters.status).toBe('Confirmed');
    expect(result.current.filters.page_size).toBe(20);
  });

  it('should refetch payments when refetch is called', async () => {
    const mockResponse: PaymentsResponse = {
      payment_entries: [],
      pagination: {
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0,
      },
    };

    vi.mocked(paymentApi.fetchPayments).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePayments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(paymentApi.fetchPayments).toHaveBeenCalledTimes(1);

    result.current.refetch();

    await waitFor(() => {
      expect(paymentApi.fetchPayments).toHaveBeenCalledTimes(2);
    });
  });

  it('should not fetch when accessToken is missing', async () => {
    const { useUserStore } = await import('@horizon-sync/store');
    vi.mocked(useUserStore).mockImplementation((selector: any) =>
      selector({ accessToken: null })
    );

    const { result } = renderHook(() => usePayments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(paymentApi.fetchPayments).not.toHaveBeenCalled();
    expect(result.current.payments).toHaveLength(0);
  });
});
