import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { AuditLogFilters, AuditLogListResponse } from '../types/audit.types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;
const API_IDENTITY_URL = environment.apiIdentityUrl;

export class AdminAuditLogService {
  private static async request<T>(
    baseUrl: string,
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
      response = await fetch(`${baseUrl}${endpoint}`, {
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

  private static buildQueryString(filters?: AuditLogFilters): string {
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
    return params.toString();
  }

  static async getAuditLogs(
    filters?: AuditLogFilters
  ): Promise<AuditLogListResponse> {
    const query = this.buildQueryString(filters);

    // Core-service: paginated normally
    // Identity-service: fetch with same page_size but page 1 (small dataset)
    const identityQuery = this.buildQueryString({ ...filters, page: 1, page_size: filters?.page_size || 20 });

    const [coreResult, identityResult] = await Promise.allSettled([
      this.request<AuditLogListResponse>(
        API_CORE_URL,
        `/api/v1/admin/audit-logs${query ? `?${query}` : ''}`
      ),
      this.request<AuditLogListResponse>(
        API_IDENTITY_URL,
        `/api/v1/entity-audit-logs${identityQuery ? `?${identityQuery}` : ''}`
      ),
    ]);

    const coreLogs =
      coreResult.status === 'fulfilled' ? coreResult.value.audit_logs : [];
    const identityLogs =
      identityResult.status === 'fulfilled'
        ? identityResult.value.audit_logs
        : [];

    // Merge and sort by created_at descending
    const allLogs = [...coreLogs, ...identityLogs].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Use core-service pagination as the driver
    const coreP =
      coreResult.status === 'fulfilled'
        ? coreResult.value.pagination
        : { page: 1, page_size: 20, total_items: 0, total_pages: 1, has_next: false, has_prev: false };

    const pageSize = filters?.page_size || coreP.page_size || 20;
    const identityTotal =
      identityResult.status === 'fulfilled'
        ? identityResult.value.pagination.total_items
        : 0;
    const totalItems = coreP.total_items + identityTotal;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    // Trim merged results to page_size so the table shows the correct number of rows
    const trimmedLogs = allLogs.slice(0, pageSize);

    return {
      audit_logs: trimmedLogs,
      pagination: {
        page: coreP.page,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: coreP.page < totalPages,
        has_prev: coreP.page > 1,
      },
    };
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

    // Identity-service tables
    const identityTables = ['users', 'organizations'];
    const baseUrl = identityTables.includes(tableName)
      ? API_IDENTITY_URL
      : API_CORE_URL;
    const endpoint = identityTables.includes(tableName)
      ? `/api/v1/entity-audit-logs?record_id=${recordId}&${query}`
      : `/api/v1/admin/audit-logs/${recordId}/history${query ? `?${query}` : ''}`;

    return this.request<AuditLogListResponse>(baseUrl, endpoint);
  }
}
