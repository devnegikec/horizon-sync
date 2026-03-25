import type { Invoice } from '@horizon-sync/ui';

import type { PaginationMeta } from './common.types';

export interface AdminInvoiceListItem {
  id: string;
  organization_id: string;
  organization_name: string | null;
  invoice_no: string;
  invoice_type: 'sales' | 'purchase';
  party_id: string;
  party_name: string | null;
  party_code: string | null;
  status: string;
  posting_date: string;
  due_date: string | null;
  grand_total: number;
  outstanding_amount: number | null;
  created_at: string;
}

export interface AdminInvoiceListResponse {
  invoices: AdminInvoiceListItem[];
  pagination: PaginationMeta;
}

export interface AdminInvoiceFilters {
  search?: string;
  organization_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface AdminInvoiceStatsResponse {
  total_invoices: number;
  overdue_invoices: number;
  total_outstanding: number;
  total_overdue_amount: number;
}

export type AdminInvoiceDetailResponse = Invoice & {
  organization_name: string | null;
};
