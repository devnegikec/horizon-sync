import { useMemo } from 'react';
import type { PaymentMode, PaymentType } from '../types/payment.types';

export interface PaymentFormData {
  payment_type?: PaymentType;
  party_id?: string;
  amount?: number | string;
  payment_date?: string;
  reference_no?: string;
  payment_mode?: PaymentMode;
  currency_code?: string;
}

export interface ValidationErrors {
  payment_type?: string;
  party_id?: string;
  amount?: string;
  payment_date?: string;
  reference_no?: string;
  currency_code?: string;
  payment_mode?: string;
}

export function usePaymentValidation(
  formData: PaymentFormData,
  mode: 'create' | 'edit' = 'edit'
) {
  const errors = useMemo<ValidationErrors>(() => {
    const validationErrors: ValidationErrors = {};

    // Required fields for create mode
    if (mode === 'create') {
      if (!formData.payment_type || formData.payment_type.trim?.() === '') {
        validationErrors.payment_type = 'Payment type is required';
      }
      if (!formData.party_id || formData.party_id.trim?.() === '') {
        validationErrors.party_id = 'Party is required';
      }
      if (!formData.payment_mode) {
        validationErrors.payment_mode = 'Payment mode is required';
      }
    }

    // Amount is required (create and edit)
    if (formData.amount === undefined || formData.amount === '') {
      validationErrors.amount = 'Amount is required';
    } else {
      const amountNum = typeof formData.amount === 'string'
        ? parseFloat(formData.amount)
        : formData.amount;

      if (isNaN(amountNum) || amountNum <= 0) {
        validationErrors.amount = 'Amount must be greater than 0';
      } else {
        // Check for max 2 decimal places
        const amountStr = amountNum.toString();
        const decimalPart = amountStr.split('.')[1];
        if (decimalPart && decimalPart.length > 2) {
          validationErrors.amount = 'Amount can have maximum 2 decimal places';
        }
      }
    }

    // Payment date is required
    if (!formData.payment_date || formData.payment_date.trim?.() === '') {
      validationErrors.payment_date = 'Payment date is required';
    } else {

    // Validate payment_date (not more than 30 days in future)
      const paymentDate = new Date(formData.payment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxFutureDate = new Date(today);
      maxFutureDate.setDate(maxFutureDate.getDate() + 30);
      if (paymentDate > maxFutureDate) {
        validationErrors.payment_date = 'Payment date cannot be more than 30 days in the future';
      }
    }

    // Currency is required
    if (!formData.currency_code || formData.currency_code.trim?.() === '') {
      validationErrors.currency_code = 'Currency code is required';
    } else {
      const currencyRegex = /^[A-Z]{3}$/;
      if (!currencyRegex.test(formData.currency_code)) {
        validationErrors.currency_code = 'Currency code must be 3 uppercase letters (e.g., USD, EUR)';
      }
    }

    // Validate reference_no for Check and Bank_Transfer
    if (
      formData.payment_mode &&
      (formData.payment_mode === 'Check' || formData.payment_mode === 'Bank_Transfer')
    ) {
      if (!formData.reference_no || formData.reference_no.trim() === '') {
        validationErrors.reference_no = 'Reference number is required for Check and Bank Transfer';
      }
    }

    return validationErrors;
  }, [formData, mode]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    errors,
    isValid,
  };
}
