import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  Invoice,
  InvoiceCreateRequest,
  InvoiceListResponse,
  AdminInvoiceFilters
} from '../types/billing.types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class AdminInvoiceService {
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

  // ── Invoice List & Management ─────────────────────────────────────────

  static async list(
    filters?: AdminInvoiceFilters
  ): Promise<InvoiceListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.organization_id) params.append('organization_id', filters.organization_id);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    const endpoint = `/api/v1/admin/invoices${query ? `?${query}` : ''}`;

    return this.request<InvoiceListResponse>(endpoint);
  }

  // Keep backward compatibility with existing getInvoices method
  static async getInvoices(params: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    organization_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<InvoiceListResponse> {
    return this.list(params);
  }

  static async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${invoiceId}`);
  }

  static async createInvoice(invoiceData: InvoiceCreateRequest & { organization_id: string }): Promise<Invoice> {
    const { organization_id, ...invoicePayload } = invoiceData;

    return this.request<Invoice>(`/api/v1/admin/invoices?organization_id=${organization_id}`, {
      method: 'POST',
      body: JSON.stringify({
        ...invoicePayload,
        // Ensure proper field mapping for admin API
        invoice_type: invoicePayload.invoice_type?.toLowerCase(),
        party_type: invoicePayload.party_type?.toLowerCase(),
      }),
    });
  }

  static async updateInvoice(
    invoiceId: string,
    updateData: Partial<InvoiceCreateRequest>
  ): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async deleteInvoice(invoiceId: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  // ── Invoice Status Management ─────────────────────────────────────────

  static async sendInvoice(invoiceId: string): Promise<{ sent: boolean; message: string }> {
    return this.request<{ sent: boolean; message: string }>(
      `/api/v1/admin/invoices/${invoiceId}/send`,
      {
        method: 'POST',
      }
    );
  }

  static async markAsPaid(
    invoiceId: string,
    paymentData: {
      payment_date: string;
      payment_method: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${invoiceId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async cancelInvoice(
    invoiceId: string,
    reason: string
  ): Promise<Invoice> {
    return this.request<Invoice>(`/api/v1/admin/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ── Invoice Export & Download ─────────────────────────────────────────

  static async exportInvoices(params: {
    status?: string;
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
    const endpoint = `/api/v1/admin/invoices/export${query ? `?${query}` : ''}`;

    const token = useUserStore.getState().accessToken;
    const response = await fetch(`${API_CORE_URL}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export invoices');
    }

    return response.blob();
  }

  static async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    const token = useUserStore.getState().accessToken;
    const response = await fetch(
      `${API_CORE_URL}/api/v1/admin/invoices/${invoiceId}/pdf`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download invoice PDF');
    }

    return response.blob();
  }

  // ── Invoice Statistics ────────────────────────────────────────────────

  static async getInvoiceStats(params: {
    organization_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
    status_breakdown: Record<string, number>;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/invoices/stats${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }
}