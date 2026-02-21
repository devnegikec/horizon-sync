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
import { useUserStore } from '@horizon-sync/store';
// Payments API is on core-service (port 8001), not identity-service (port 8000)
const API_BASE_URL = process.env['NX_API_URL'] || 'http://localhost:8001';

/**
 * Fetch payments with optional filters
 */
export async function fetchPayments(
  filters?: PaymentFilters
): Promise<PaymentsResponse> {
  const accessToken = useUserStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const params = new URLSearchParams();

  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
    if (filters.payment_type) params.append('payment_type', filters.payment_type);
    if (filters.party_id) params.append('party_id', filters.party_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.has_unallocated !== undefined)
      params.append('has_unallocated', String(filters.has_unallocated));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.page_size) params.append('page_size', String(filters.page_size));
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch payments');
  }

  return response.json();
}

/**
 * Fetch a single payment by ID
 */
export async function fetchPaymentById(id: string): Promise<PaymentEntry> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/payments/${id}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Payment not found');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch payment');
  }

  return response.json();
}

/**
 * Create a new payment entry
 */
export async function createPaymentEntry(
  data: CreatePaymentPayload
): Promise<PaymentEntry> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create payment');
  }

  return response.json();
}

/**
 * Update an existing payment entry
 */
export async function updatePaymentEntry(
  id: string,
  data: UpdatePaymentPayload
): Promise<PaymentEntry> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/payments/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Payment cannot be updated (not in Draft status)');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update payment');
  }

  return response.json();
}

/**
 * Confirm a payment entry
 */
export async function confirmPaymentEntry(id: string): Promise<PaymentEntry> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/payments/${id}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Payment cannot be confirmed');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to confirm payment');
  }

  return response.json();
}

/**
 * Cancel a payment entry
 */
export async function cancelPaymentEntry(
  id: string,
  reason: string
): Promise<PaymentEntry> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const payload: CancelPaymentPayload = {
    cancellation_reason: reason,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/payments/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Payment cannot be cancelled');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to cancel payment');
  }

  return response.json();
}

/**
 * Create an allocation (link payment to invoice)
 */
export async function createAllocation(
  paymentId: string,
  data: AllocationCreate
): Promise<PaymentReference> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments/${paymentId}/allocations`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create allocation');
  }

  return response.json();
}

/**
 * Delete an allocation
 */
export async function deleteAllocation(allocationId: string): Promise<void> {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments/allocations/${allocationId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Allocation not found');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete allocation');
  }
}

/**
 * Download payment receipt as PDF
 */
export async function downloadReceipt(paymentId: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments/${paymentId}/receipt`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Receipt not found or payment not confirmed');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to download receipt');
  }

  return response.blob();
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
  const params = new URLSearchParams();

  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.party_id) params.append('party_id', filters.party_id);
  if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
  if (filters.status) params.append('status', filters.status);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments/reports/reconciliation?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch reconciliation report');
  }

  return response.json();
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
  const params = new URLSearchParams();

  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.party_id) params.append('party_id', filters.party_id);
  if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
  if (filters.status) params.append('status', filters.status);
  params.append('format', format);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/payments/reports/reconciliation/export?${params.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export reconciliation report');
  }

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
