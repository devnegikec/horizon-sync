/**
 * Payment API Utilities
 * 
 * API functions for payment operations
 */

import {
  PaymentEntry,
  PaymentReference,
  PaymentsResponse,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  AllocationCreate,
  CancelPaymentPayload,
  PaymentFilters,
} from '../../types/payment.types';
import { apiRequest, buildPaginationParams } from './core';

// Helper to get access token from auth context
const getAccessToken = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token available');
  }
  return token;
};

/**
 * Fetch payments with optional filters
 */
export async function fetchPayments(
  filters?: PaymentFilters
): Promise<PaymentsResponse> {
  const accessToken = getAccessToken();
  return apiRequest<PaymentsResponse>('/payments', accessToken, {
    params: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.payment_mode && { payment_mode: filters.payment_mode }),
      ...(filters?.payment_type && { payment_type: filters.payment_type }),
      ...(filters?.party_id && { party_id: filters.party_id }),
      ...(filters?.date_from && { date_from: filters.date_from }),
      ...(filters?.date_to && { date_to: filters.date_to }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.has_unallocated !== undefined && { has_unallocated: filters.has_unallocated }),
      ...(filters?.page && { page: filters.page }),
      ...(filters?.page_size && { page_size: filters.page_size }),
      ...(filters?.sort_by && { sort_by: filters.sort_by }),
      ...(filters?.sort_order && { sort_order: filters.sort_order }),
    },
  });
}

/**
 * Fetch a single payment by ID
 */
export async function fetchPaymentById(id: string): Promise<PaymentEntry> {
  const accessToken = getAccessToken();
  return apiRequest<PaymentEntry>(`/payments/${id}`, accessToken);
}

/**
 * Create a new payment entry
 */
export async function createPaymentEntry(
  data: CreatePaymentPayload
): Promise<PaymentEntry> {
  const accessToken = getAccessToken();
  return apiRequest<PaymentEntry>('/payments', accessToken, {
    method: 'POST',
    body: data,
  });
}

/**
 * Update an existing payment entry
 */
export async function updatePaymentEntry(
  id: string,
  data: UpdatePaymentPayload
): Promise<PaymentEntry> {
  const accessToken = getAccessToken();
  try {
    return await apiRequest<PaymentEntry>(`/payments/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    });
  } catch (error: any) {
    if (error.status === 409) {
      throw new Error('Payment cannot be updated (not in Draft status)');
    }
    throw error;
  }
}

/**
 * Confirm a payment entry
 */
export async function confirmPaymentEntry(id: string): Promise<PaymentEntry> {
  const accessToken = getAccessToken();
  return apiRequest<PaymentEntry>(`/payments/${id}/confirm`, accessToken, {
    method: 'POST',
  });
}

/**
 * Cancel a payment entry
 */
export async function cancelPaymentEntry(
  id: string,
  reason: string
): Promise<PaymentEntry> {
  const accessToken = getAccessToken();
  const payload: CancelPaymentPayload = {
    cancellation_reason: reason,
  };

  try {
    return await apiRequest<PaymentEntry>(`/payments/${id}/cancel`, accessToken, {
      method: 'POST',
      body: payload,
    });
  } catch (error: any) {
    if (error.status === 409) {
      throw new Error('Payment cannot be cancelled');
    }
    throw error;
  }
}

/**
 * Create an allocation (link payment to invoice)
 */
export async function createAllocation(
  paymentId: string,
  data: AllocationCreate
): Promise<PaymentReference> {
  const accessToken = getAccessToken();
  return apiRequest<PaymentReference>(`/payments/${paymentId}/allocations`, accessToken, {
    method: 'POST',
    body: data,
  });
}

/**
 * Delete an allocation
 */
export async function deleteAllocation(allocationId: string): Promise<void> {
  const accessToken = getAccessToken();
  try {
    return await apiRequest<void>(`/payments/allocations/${allocationId}`, accessToken, {
      method: 'DELETE',
    });
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Allocation not found');
    }
    throw error;
  }
}

/**
 * Download payment receipt as PDF
 */
export async function downloadReceipt(paymentId: string): Promise<Blob> {
  try {
    return await apiRequest<Blob>(`/payments/${paymentId}/receipt`, undefined, {
      method: 'GET',
      responseType: 'blob',
      credentials: 'include',
    });
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error('Receipt not found or payment not confirmed');
    }
    throw error;
  }
}

/**
 * Get reconciliation report
 */
export async function getReconciliationReport(filters: {
  date_from?: string;
  date_to?: string;
  party_id?: string;
  payment_mode?: string;
  status?: string;
}): Promise<any> {
  return apiRequest<any>('/payments/reports/reconciliation', undefined, {
    method: 'GET',
    params: {
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
      ...(filters.party_id && { party_id: filters.party_id }),
      ...(filters.payment_mode && { payment_mode: filters.payment_mode }),
      ...(filters.status && { status: filters.status }),
    },
    credentials: 'include',
  });
}

/**
 * Export reconciliation report
 */
export async function exportReconciliationReport(
  filters: {
    date_from?: string;
    date_to?: string;
    party_id?: string;
    payment_mode?: string;
    status?: string;
  },
  format: 'excel' | 'pdf'
): Promise<void> {
  const blob = await apiRequest<Blob>('/payments/reports/reconciliation/export', undefined, {
    method: 'GET',
    params: {
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
      ...(filters.party_id && { party_id: filters.party_id }),
      ...(filters.payment_mode && { payment_mode: filters.payment_mode }),
      ...(filters.status && { status: filters.status }),
      format,
    },
    responseType: 'blob',
    credentials: 'include',
  });

  // Download the file
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
