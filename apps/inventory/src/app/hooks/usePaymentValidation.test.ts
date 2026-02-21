import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePaymentValidation } from './usePaymentValidation';
import type { PaymentFormData } from './usePaymentValidation';

describe('usePaymentValidation', () => {
  describe('amount validation', () => {
    it('should validate amount > 0', () => {
      const formData: PaymentFormData = { amount: 0 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBe('Amount must be greater than 0');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate negative amount', () => {
      const formData: PaymentFormData = { amount: -100 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBe('Amount must be greater than 0');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate max 2 decimal places', () => {
      const formData: PaymentFormData = { amount: 100.123 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBe('Amount can have maximum 2 decimal places');
      expect(result.current.isValid).toBe(false);
    });

    it('should accept valid amount with 2 decimals', () => {
      const formData: PaymentFormData = { amount: 100.99 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBeUndefined();
    });

    it('should accept valid amount with 1 decimal', () => {
      const formData: PaymentFormData = { amount: 100.5 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBeUndefined();
    });

    it('should accept valid amount with no decimals', () => {
      const formData: PaymentFormData = { amount: 100 };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBeUndefined();
    });

    it('should handle string amount', () => {
      const formData: PaymentFormData = { amount: '100.50' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBeUndefined();
    });

    it('should handle invalid string amount', () => {
      const formData: PaymentFormData = { amount: 'invalid' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBe('Amount must be greater than 0');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('payment_date validation', () => {
    it('should reject date more than 30 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 31);
      const formData: PaymentFormData = {
        payment_date: futureDate.toISOString().split('T')[0],
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.payment_date).toBe(
        'Payment date cannot be more than 30 days in the future'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should accept date exactly 30 days in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const formData: PaymentFormData = {
        payment_date: futureDate.toISOString().split('T')[0],
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.payment_date).toBeUndefined();
    });

    it('should accept today date', () => {
      const today = new Date();
      const formData: PaymentFormData = {
        payment_date: today.toISOString().split('T')[0],
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.payment_date).toBeUndefined();
    });

    it('should accept past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const formData: PaymentFormData = {
        payment_date: pastDate.toISOString().split('T')[0],
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.payment_date).toBeUndefined();
    });
  });

  describe('reference_no validation', () => {
    it('should require reference_no for Check payment mode', () => {
      const formData: PaymentFormData = {
        payment_mode: 'Check',
        reference_no: '',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.reference_no).toBe(
        'Reference number is required for Check and Bank Transfer'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should require reference_no for Bank_Transfer payment mode', () => {
      const formData: PaymentFormData = {
        payment_mode: 'Bank_Transfer',
        reference_no: '',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.reference_no).toBe(
        'Reference number is required for Check and Bank Transfer'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should accept reference_no for Check payment mode', () => {
      const formData: PaymentFormData = {
        payment_mode: 'Check',
        reference_no: 'CHK-12345',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.reference_no).toBeUndefined();
    });

    it('should not require reference_no for Cash payment mode', () => {
      const formData: PaymentFormData = {
        payment_mode: 'Cash',
        reference_no: '',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.reference_no).toBeUndefined();
    });

    it('should not require reference_no for Credit_Card payment mode', () => {
      const formData: PaymentFormData = {
        payment_mode: 'Credit_Card',
        reference_no: '',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.reference_no).toBeUndefined();
    });
  });

  describe('currency_code validation', () => {
    it('should validate currency code format (3 uppercase letters)', () => {
      const formData: PaymentFormData = { currency_code: 'us' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.currency_code).toBe(
        'Currency code must be 3 uppercase letters (e.g., USD, EUR)'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should reject lowercase currency code', () => {
      const formData: PaymentFormData = { currency_code: 'usd' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.currency_code).toBe(
        'Currency code must be 3 uppercase letters (e.g., USD, EUR)'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should reject currency code with numbers', () => {
      const formData: PaymentFormData = { currency_code: 'US1' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.currency_code).toBe(
        'Currency code must be 3 uppercase letters (e.g., USD, EUR)'
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should accept valid currency code', () => {
      const formData: PaymentFormData = { currency_code: 'USD' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.currency_code).toBeUndefined();
    });

    it('should accept EUR currency code', () => {
      const formData: PaymentFormData = { currency_code: 'EUR' };
      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.currency_code).toBeUndefined();
    });
  });

  describe('isValid flag', () => {
    it('should return true when no errors', () => {
      const formData: PaymentFormData = {
        amount: 100,
        payment_date: new Date().toISOString().split('T')[0],
        currency_code: 'USD',
        payment_mode: 'Cash',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.isValid).toBe(true);
      expect(Object.keys(result.current.errors)).toHaveLength(0);
    });

    it('should return false when there are errors', () => {
      const formData: PaymentFormData = {
        amount: -100,
        currency_code: 'invalid',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.isValid).toBe(false);
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });
  });

  describe('multiple validation errors', () => {
    it('should return all validation errors', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 31);

      const formData: PaymentFormData = {
        amount: 0,
        payment_date: futureDate.toISOString().split('T')[0],
        payment_mode: 'Check',
        reference_no: '',
        currency_code: 'us',
      };

      const { result } = renderHook(() => usePaymentValidation(formData));

      expect(result.current.errors.amount).toBeDefined();
      expect(result.current.errors.payment_date).toBeDefined();
      expect(result.current.errors.reference_no).toBeDefined();
      expect(result.current.errors.currency_code).toBeDefined();
      expect(result.current.isValid).toBe(false);
    });
  });
});
