import { apiRequest, buildPaginationParams } from './core';

// Pick Lists API helpers
export const pickListApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/pick-lists', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'created_at', filters?.sort_order || 'desc'),
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/pick-lists/${id}`, accessToken),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/pick-lists/${id}`, accessToken, {
      method: 'DELETE',
    }),

  updateStatus: (accessToken: string, id: string, data: { status: string }) =>
    apiRequest(`/pick-lists/${id}/status`, accessToken, {
      method: 'PUT',
      body: data,
    }),
};
