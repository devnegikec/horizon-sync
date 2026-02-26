import { apiRequest, buildPaginationParams } from './core';

// Warehouse API helpers
export const warehouseApi = {
  list: (accessToken: string, page = 1, pageSize = 20) =>
    apiRequest('/warehouses', accessToken, {
      params: buildPaginationParams(page, pageSize),
    }),

  get: (accessToken: string, id: string) => apiRequest(`/warehouses/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/warehouses', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/warehouses/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/warehouses/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
