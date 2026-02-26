import { apiRequest, buildPaginationParams } from './core';

// Sales Orders API helpers
export const salesOrderApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { customer_id?: string; status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/sales-orders', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'order_date', filters?.sort_order || 'desc'),
        customer_id: filters?.customer_id,
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/sales-orders/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/sales-orders', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/sales-orders/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/sales-orders/${id}`, accessToken, {
      method: 'DELETE',
    }),

  updateStatus: (accessToken: string, id: string, data: { status: string }) =>
    apiRequest(`/sales-orders/${id}/status`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  convertToInvoice: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/sales-orders/${id}/convert-to-invoice`, accessToken, {
      method: 'POST',
      body: data,
    }),

  convertToDeliveryNote: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/sales-orders/${id}/convert-to-delivery-note`, accessToken, {
      method: 'POST',
      body: data,
    }),
};
