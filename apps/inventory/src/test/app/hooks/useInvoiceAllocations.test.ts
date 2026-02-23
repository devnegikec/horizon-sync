import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInvoiceAllocations } from '../../../app/hooks/useInvoiceAllocations';
import { paymentApi } from '../../../app/utility/api';
import type { PaymentEntry, PaymentReference } from '../../../app/types/payment.types';

const mockToast = vi.fn();

vi.mock('@horizon-sync/store', () => ({
  useUserStore: vi.fn((selector) => selector({ accessToken: 'test-token' })),
}));

vi.mock('@horizon-sync/ui/hooks', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('../../../app/utility/api', () => ({
  paymentApi: {
    fetchPaymentById: vi.fn(),
    createAllocation: vi.fn(),
    deleteAllocation: vi.fn(),
  },
}));

describe('useInvoiceAllocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch allocations on mount', async () => {
    const mockAllocations: PaymentReference[] = [
      {
        id: 'alloc-1',
        payment_entry_id: 'pay-1',
        invoice_id: 'inv-1',
        invoice_number: 'INV-001',
        allocated_amount: 500,
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
      },
    ];

    const mockPayment: PaymentEntry = {
      id: 'pay-1',
      receipt_number: 'PAY-001',
      payment_type: 'Customer',
      payment_date: '2026-02-20',
      amount: 1000,
      currency_code: 'USD',
      payment_mode: 'Cash',
      status: 'Confirmed',
      party_id: 'cust-1',
      party_name: 'Test Customer',
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
      allocations: mockAllocations,
    };

    vi.mocked(paymentApi.fetchPaymentById).mockResolvedValue(mockPayment);

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allocations).toHaveLength(1);
    expect(result.current.allocations[0].invoice_number).toBe('INV-001');
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    vi.mocked(paymentApi.fetchPaymentById).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.allocations).toHaveLength(0);
  });

  it('should not fetch when paymentId is null', async () => {
    const { result } = renderHook(() => useInvoiceAllocations(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(paymentApi.fetchPaymentById).not.toHaveBeenCalled();
    expect(result.current.allocations).toHaveLength(0);
  });

  it('should create allocation successfully', async () => {
    const mockPayment: PaymentEntry = {
      id: 'pay-1',
      receipt_number: 'PAY-001',
      payment_type: 'Customer',
      payment_date: '2026-02-20',
      amount: 1000,
      currency_code: 'USD',
      payment_mode: 'Cash',
      status: 'Confirmed',
      party_id: 'cust-1',
      party_name: 'Test Customer',
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
      allocations: [],
    };

    const mockAllocation: PaymentReference = {
      id: 'alloc-1',
      payment_entry_id: 'pay-1',
      invoice_id: 'inv-1',
      invoice_number: 'INV-001',
      allocated_amount: 500,
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
    };

    vi.mocked(paymentApi.fetchPaymentById).mockResolvedValue(mockPayment);
    vi.mocked(paymentApi.createAllocation).mockResolvedValue(mockAllocation);

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const allocation = await result.current.createAllocation({
      invoice_id: 'inv-1',
      allocated_amount: 500,
    });

    expect(allocation).toEqual(mockAllocation);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Allocation created successfully',
    });
  });

  it('should remove allocation successfully', async () => {
    const mockPayment: PaymentEntry = {
      id: 'pay-1',
      receipt_number: 'PAY-001',
      payment_type: 'Customer',
      payment_date: '2026-02-20',
      amount: 1000,
      currency_code: 'USD',
      payment_mode: 'Cash',
      status: 'Confirmed',
      party_id: 'cust-1',
      party_name: 'Test Customer',
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
      allocations: [],
    };

    vi.mocked(paymentApi.fetchPaymentById).mockResolvedValue(mockPayment);
    vi.mocked(paymentApi.deleteAllocation).mockResolvedValue(undefined);

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.removeAllocation('alloc-1');

    expect(success).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Allocation removed successfully',
    });
  });

  it('should calculate remaining amount correctly', async () => {
    const mockAllocations: PaymentReference[] = [
      {
        id: 'alloc-1',
        payment_entry_id: 'pay-1',
        invoice_id: 'inv-1',
        invoice_number: 'INV-001',
        allocated_amount: 300,
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
      },
      {
        id: 'alloc-2',
        payment_entry_id: 'pay-1',
        invoice_id: 'inv-2',
        invoice_number: 'INV-002',
        allocated_amount: 200,
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
      },
    ];

    const mockPayment: PaymentEntry = {
      id: 'pay-1',
      receipt_number: 'PAY-001',
      payment_type: 'Customer',
      payment_date: '2026-02-20',
      amount: 1000,
      currency_code: 'USD',
      payment_mode: 'Cash',
      status: 'Confirmed',
      party_id: 'cust-1',
      party_name: 'Test Customer',
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
      allocations: mockAllocations,
    };

    vi.mocked(paymentApi.fetchPaymentById).mockResolvedValue(mockPayment);

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const remaining = result.current.calculateRemainingAmount(1000);
    expect(remaining).toBe(500); // 1000 - 300 - 200 = 500
  });

  it('should return 0 when allocated amount exceeds total', async () => {
    const mockAllocations: PaymentReference[] = [
      {
        id: 'alloc-1',
        payment_entry_id: 'pay-1',
        invoice_id: 'inv-1',
        invoice_number: 'INV-001',
        allocated_amount: 1200,
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
      },
    ];

    const mockPayment: PaymentEntry = {
      id: 'pay-1',
      receipt_number: 'PAY-001',
      payment_type: 'Customer',
      payment_date: '2026-02-20',
      amount: 1000,
      currency_code: 'USD',
      payment_mode: 'Cash',
      status: 'Confirmed',
      party_id: 'cust-1',
      party_name: 'Test Customer',
      organization_id: 'org-1',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
      allocations: mockAllocations,
    };

    vi.mocked(paymentApi.fetchPaymentById).mockResolvedValue(mockPayment);

    const { result } = renderHook(() => useInvoiceAllocations('pay-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const remaining = result.current.calculateRemainingAmount(1000);
    expect(remaining).toBe(0); // Max(0, 1000 - 1200) = 0
  });
});
