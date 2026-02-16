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

// Supplier API helpers (for supplier management, not item-supplier relationships)
// TODO: Implement proper supplier API endpoints
export const supplierApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: Record<string, string | number | boolean | undefined>) => {
    console.warn('[supplierApi] list() not fully implemented yet');
    return apiRequest('/suppliers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    });
  },

  getById: (id: string, accessToken: string) => {
    console.warn('[supplierApi] getById() not fully implemented yet');
    return apiRequest(`/suppliers/${id}`, accessToken);
  },

  create: (payload: unknown, accessToken: string) => {
    console.warn('[supplierApi] create() not fully implemented yet');
    return apiRequest('/suppliers', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  update: (id: string, payload: unknown, accessToken: string) => {
    console.warn('[supplierApi] update() not fully implemented yet');
    return apiRequest(`/suppliers/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  delete: (id: string, accessToken: string) => {
    console.warn('[supplierApi] delete() not fully implemented yet');
    return apiRequest(`/suppliers/${id}`, accessToken, {
      method: 'DELETE',
    });
  },
};
