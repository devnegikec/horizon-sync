import { apiRequest, buildPaginationParams } from './core';

// Quotations API helpers
export const quotationApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/quotations', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'quotation_date', filters?.sort_order || 'desc'),
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/quotations/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/quotations', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/quotations/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/quotations/${id}`, accessToken, {
      method: 'DELETE',
    }),

  updateStatus: (accessToken: string, id: string, data: { status: string }) =>
    apiRequest(`/quotations/${id}/status`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  convertToSalesOrder: (accessToken: string, id: string, data?: unknown) =>
    apiRequest(`/quotations/${id}/convert-to-sales-order`, accessToken, {
      method: 'POST',
      body: data || {},
    }),
};
