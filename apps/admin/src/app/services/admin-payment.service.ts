import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { Payment, PaymentCreateRequest, PaymentListResponse } from '../types/billing.types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class AdminPaymentService {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = useUserStore.getState().accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let response: Response;
    try {
      response = await fetch(`${API_CORE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      try {
        (error as Error & { data?: unknown }).data = await response.json();
      } catch {
        // ignore JSON parse failure
      }
      handleApiError(error);
    }

    return response.json();
  }

  // ── Payment List & Management ─────────────────────────────────────────

  static async getPayments(params: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    payment_method?: string;
    organization_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaymentListResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payments${query ? `?${query}` : ''}`;

    return this.request<PaymentListResponse>(endpoint);
  }

  static async getPayment(paymentId: string): Promise<Payment> {
    return this.request<Payment>(`/api/v1/admin/payments/${paymentId}`);
  }

  static async createPayment(paymentData: PaymentCreateRequest): Promise<Payment> {
    return this.request<Payment>('/api/v1/admin/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async updatePayment(
    paymentId: string,
    updateData: Partial<PaymentCreateRequest>
  ): Promise<Payment> {
    return this.request<Payment>(`/api/v1/admin/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async deletePayment(paymentId: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  // ── Payment Status Management ─────────────────────────────────────────

  static async processPayment(
    paymentId: string,
    processingData: {
      processor_reference?: string;
      notes?: string;
    }
  ): Promise<Payment> {
    return this.request<Payment>(`/api/v1/admin/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify(processingData),
    });
  }

  static async refundPayment(
    paymentId: string,
    refundData: {
      amount: number;
      reason: string;
      refund_method?: string;
    }
  ): Promise<Payment> {
    return this.request<Payment>(`/api/v1/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  }

  static async cancelPayment(
    paymentId: string,
    reason: string
  ): Promise<Payment> {
    return this.request<Payment>(`/api/v1/admin/payments/${paymentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ── Payment Export & Reports ──────────────────────────────────────────

  static async exportPayments(params: {
    status?: string;
    payment_method?: string;
    organization_id?: string;
    date_from?: string;
    date_to?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payments/export${query ? `?${query}` : ''}`;

    const token = useUserStore.getState().accessToken;
    const response = await fetch(`${API_CORE_URL}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export payments');
    }

    return response.blob();
  }

  static async downloadPaymentReceipt(paymentId: string): Promise<Blob> {
    const token = useUserStore.getState().accessToken;
    const response = await fetch(
      `${API_CORE_URL}/api/v1/admin/payments/${paymentId}/receipt`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download payment receipt');
    }

    return response.blob();
  }

  // ── Payment Statistics ────────────────────────────────────────────────

  static async getPaymentStats(params: {
    organization_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_payments: number;
    total_amount: number;
    completed_amount: number;
    pending_amount: number;
    failed_amount: number;
    refunded_amount: number;
    method_breakdown: Record<string, number>;
    status_breakdown: Record<string, number>;
  }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payments/stats${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  // ── Payment Reconciliation ───────────────────────────────────────────

  static async reconcilePayments(params: {
    date_from: string;
    date_to: string;
    payment_method?: string;
  }): Promise<{
    reconciliation_id: string;
    total_records: number;
    matched_records: number;
    unmatched_records: number;
    discrepancies: Array<{
      payment_id: string;
      issue: string;
      expected_amount: number;
      actual_amount: number;
    }>;
  }> {
    return this.request(`/api/v1/admin/payments/reconcile`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ── Bulk Operations ───────────────────────────────────────────────────

  static async bulkUpdatePayments(params: {
    payment_ids: string[];
    update_data: {
      status?: string;
      notes?: string;
    };
  }): Promise<{
    updated_count: number;
    failed_count: number;
    errors: Array<{ payment_id: string; error: string }>;
  }> {
    return this.request(`/api/v1/admin/payments/bulk-update`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async bulkProcessPayments(paymentIds: string[]): Promise<{
    processed_count: number;
    failed_count: number;
    errors: Array<{ payment_id: string; error: string }>;
  }> {
    return this.request(`/api/v1/admin/payments/bulk-process`, {
      method: 'POST',
      body: JSON.stringify({ payment_ids: paymentIds }),
    });
  }
}