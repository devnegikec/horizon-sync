import { apiRequest, buildPaginationParams } from './core';

import type { InvoiceCreateRequest, InvoiceUpdateRequest, MarkAsPaidRequest } from '../../types/invoice.types';

// Invoices API helpers
export const invoiceApi = {
  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: {
      invoice_type?: string;
      status?: string;
      search?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ) =>
    apiRequest('/invoices', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'posting_date', filters?.sort_order || 'desc'),
        invoice_type: filters?.invoice_type,
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/invoices/${id}`, accessToken),

  create: (accessToken: string, data: InvoiceCreateRequest) =>
    apiRequest('/invoices', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: InvoiceUpdateRequest) =>
    apiRequest(`/invoices/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/invoices/${id}`, accessToken, {
      method: 'DELETE',
    }),

  markAsPaid: (accessToken: string, id: string, data?: MarkAsPaidRequest) =>
    apiRequest(`/invoices/${id}/mark-paid`, accessToken, {
      method: 'POST',
      body: data || {},
    }),

  sendEmail: (accessToken: string, id: string, emailData: { to: string; subject?: string; message?: string }) =>
    apiRequest(`/invoices/${id}/send-email`, accessToken, {
      method: 'POST',
      body: emailData,
    }),
};
