import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminInvoiceFilters,
  AdminInvoiceListResponse,
  AdminInvoiceDetailResponse,
  AdminInvoiceStatsResponse,
} from '../types';
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

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  static async list(
    filters?: AdminInvoiceFilters
  ): Promise<AdminInvoiceListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.organization_id) params.append('organization_id', filters.organization_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    const endpoint = `/api/v1/admin/invoices${query ? `?${query}` : ''}`;

    return this.request<AdminInvoiceListResponse>(endpoint);
  }

  static async getById(id: string): Promise<AdminInvoiceDetailResponse> {
    return this.request<AdminInvoiceDetailResponse>(
      `/api/v1/admin/invoices/${id}`
    );
  }

  static async getStats(
    organizationId?: string
  ): Promise<AdminInvoiceStatsResponse> {
    const params = new URLSearchParams();
    if (organizationId) params.append('organization_id', organizationId);

    const query = params.toString();
    const endpoint = `/api/v1/admin/invoices/stats${query ? `?${query}` : ''}`;

    return this.request<AdminInvoiceStatsResponse>(endpoint);
  }

  static async sendReminder(
    invoiceId: string,
    emailData: { to: string; subject: string; body: string }
  ): Promise<{ invoice_id: string; status: string }> {
    return this.request<{ invoice_id: string; status: string }>(
      `/api/v1/admin/invoices/${invoiceId}/send-reminder`,
      {
        method: 'POST',
        body: JSON.stringify(emailData),
      }
    );
  }
}
