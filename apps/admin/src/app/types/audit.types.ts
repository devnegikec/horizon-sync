import type { PaginationMeta } from './common.types';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
}

export interface AuditLogListResponse {
  audit_logs: AuditLogEntry[];
  pagination: PaginationMeta;
}

export interface AuditLogFilters {
  organization_id?: string;
  table_name?: string;
  record_id?: string;
  user_id?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  changed_field?: string;
  page?: number;
  page_size?: number;
}
