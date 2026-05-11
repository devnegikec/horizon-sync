import { apiRequest, buildPaginationParams } from './core';
import type { UpdateItemPayload } from '../../types/items-api.types';

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

  update: (accessToken: string, id: string, payload: Partial<UpdateItemPayload>) =>
    apiRequest(`/items/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    }),
};
