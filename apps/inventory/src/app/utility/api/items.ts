import { apiRequest, buildPaginationParams } from './core';

// Items API helpers
export const itemApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/items', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/items/${id}`, accessToken),
};
