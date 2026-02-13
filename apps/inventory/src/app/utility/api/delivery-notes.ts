import { apiRequest, buildPaginationParams } from './core';

// Delivery Notes API helpers
export const deliveryNoteApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { customer_id?: string; status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/delivery-notes', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'delivery_date', filters?.sort_order || 'desc'),
        customer_id: filters?.customer_id,
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/delivery-notes/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/delivery-notes', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/delivery-notes/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/delivery-notes/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
