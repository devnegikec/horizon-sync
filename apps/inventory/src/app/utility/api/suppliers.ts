import { apiRequest, buildPaginationParams } from './core';

// Item Suppliers API helpers
export const itemSupplierApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { item_id?: string; supplier_id?: string }) =>
    apiRequest('/suppliers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/item-suppliers/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/suppliers', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/suppliers/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/suppliers/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
