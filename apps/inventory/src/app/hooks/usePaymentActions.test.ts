import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePaymentActions } from './usePaymentActions';
import { paymentApi } from '../utility/api';
import type { PaymentEntry, CreatePaymentPayload } from '../types/payment.types';

const mockToast = vi.fn();

vi.mock('@horizon-sync/store', () => ({
  useUserStore: vi.fn((selector) => selector({ accessToken: 'test-token' })),
}));

vi.mock('@horizon-sync/ui/hooks', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('../utility/api', () => ({
  paymentApi: {
    createPaymentEntry: vi.fn(),
    updatePaymentEntry: vi.fn(),
    confirmPaymentEntry: vi.fn(),
    cancelPaymentEntry: vi.fn(),
    downloadReceipt: vi.fn(),
  },
}));

describe('usePaymentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const mockPayment: PaymentEntry = {
        id: '1',
        receipt_number: 'PAY-001',
        payment_type: 'Customer',
        payment_date: '2026-02-20',
        amount: 1000,
        currency_code: 'USD',
        payment_mode: 'Cash',
        status: 'Draft',
        party_id: 'cust-1',
        party_name: 'Test Customer',
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
        updated_at: '2026-02-20T10:00:00Z',
        allocations: [],
      };

      vi.mocked(paymentApi.createPaymentEntry).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePaymentActions());

      const payload: CreatePaymentPayload = {
        payment_type: 'Customer',
        party_id: 'cust-1',
        amount: 1000,
        currency_code: 'USD',
        payment_date: '2026-02-20',
        payment_mode: 'Cash',
      };

      const payment = await result.current.createPayment(payload);

      expect(payment).toEqual(mockPayment);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Payment created successfully',
      });
    });

    it('should handle create payment error', async () => {
      vi.mocked(paymentApi.createPaymentEntry).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => usePaymentActions());

      const payload: CreatePaymentPayload = {
        payment_type: 'Customer',
        party_id: 'cust-1',
        amount: 1000,
        currency_code: 'USD',
        payment_date: '2026-02-20',
        payment_mode: 'Cash',
      };

      const payment = await result.current.createPayment(payload);

      expect(payment).toBeNull();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Create failed',
        variant: 'destructive',
      });
    });
  });

  describe('updatePayment', () => {
    it('should update payment successfully', async () => {
      const mockPayment: PaymentEntry = {
        id: '1',
        receipt_number: 'PAY-001',
        payment_type: 'Customer',
        payment_date: '2026-02-20',
        amount: 1500,
        currency_code: 'USD',
        payment_mode: 'Cash',
        status: 'Draft',
        party_id: 'cust-1',
        party_name: 'Test Customer',
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
        updated_at: '2026-02-20T11:00:00Z',
        allocations: [],
      };

      vi.mocked(paymentApi.updatePaymentEntry).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePaymentActions());

      const payment = await result.current.updatePayment('1', { amount: 1500 });

      expect(payment).toEqual(mockPayment);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Payment updated successfully',
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockPayment: PaymentEntry = {
        id: '1',
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
        updated_at: '2026-02-20T11:00:00Z',
        allocations: [],
      };

      vi.mocked(paymentApi.confirmPaymentEntry).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePaymentActions());

      const payment = await result.current.confirmPayment('1');

      expect(payment).toEqual(mockPayment);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Payment confirmed successfully',
      });
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment successfully', async () => {
      const mockPayment: PaymentEntry = {
        id: '1',
        receipt_number: 'PAY-001',
        payment_type: 'Customer',
        payment_date: '2026-02-20',
        amount: 1000,
        currency_code: 'USD',
        payment_mode: 'Cash',
        status: 'Cancelled',
        party_id: 'cust-1',
        party_name: 'Test Customer',
        organization_id: 'org-1',
        created_at: '2026-02-20T10:00:00Z',
        updated_at: '2026-02-20T12:00:00Z',
        allocations: [],
      };

      vi.mocked(paymentApi.cancelPaymentEntry).mockResolvedValue(mockPayment);

      const { result } = renderHook(() => usePaymentActions());

      const payment = await result.current.cancelPayment('1', {
        cancellation_reason: 'Test reason',
      });

      expect(payment).toEqual(mockPayment);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Payment cancelled successfully',
      });
    });
  });

  describe('downloadReceipt', () => {
    it('should download receipt successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      vi.mocked(paymentApi.downloadReceipt).mockResolvedValue(mockBlob);

      // Mock DOM methods
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      const { result } = renderHook(() => usePaymentActions());

      const success = await result.current.downloadReceipt('1');

      expect(success).toBe(true);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Receipt downloaded successfully',
      });

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
