import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { AuditLogFilters, AuditLogListResponse } from '../types/audit.types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class AdminAuditLogService {
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

  static async getAuditLogs(
    filters?: AuditLogFilters
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    if (filters?.organization_id) params.append('organization_id', filters.organization_id);
    if (filters?.table_name) params.append('table_name', filters.table_name);
    if (filters?.record_id) params.append('record_id', filters.record_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.changed_field) params.append('changed_field', filters.changed_field);
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    return this.request<AuditLogListResponse>(
      `/api/v1/admin/audit-logs${query ? `?${query}` : ''}`
    );
  }

  static async getRecordHistory(
    recordId: string,
    tableName: string,
    page?: number,
    pageSize?: number
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    params.append('table_name', tableName);
    if (page != null) params.append('page', String(page));
    if (pageSize != null) params.append('page_size', String(pageSize));

    const query = params.toString();
    return this.request<AuditLogListResponse>(
      `/api/v1/admin/audit-logs/${recordId}/history${query ? `?${query}` : ''}`
    );
  }
}
