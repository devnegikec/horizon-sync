import { apiRequest, buildPaginationParams } from './core';

// Customer API helpers
export const customerApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/customers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/customers/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/customers', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/customers/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/customers/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
