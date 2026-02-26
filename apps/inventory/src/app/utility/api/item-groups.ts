import { apiRequest, buildPaginationParams } from './core';
import type { ItemGroup, ItemGroupListResponse, ItemGroupCreate, ItemGroupUpdate } from '../../types/item-group.types';

export const itemGroupApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; is_active?: boolean }) =>
    apiRequest<ItemGroupListResponse>('/item-groups', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...(filters?.search ? { search: filters.search } : {}),
        ...(filters?.is_active !== undefined ? { is_active: filters.is_active } : {}),
      },
    }),

  get: (accessToken: string, id: string) =>
    apiRequest<ItemGroup>(`/item-groups/${id}`, accessToken),

  create: (accessToken: string, data: ItemGroupCreate) =>
    apiRequest<ItemGroup>('/item-groups', accessToken, { method: 'POST', body: data }),

  update: (accessToken: string, id: string, data: ItemGroupUpdate) =>
    apiRequest<ItemGroup>(`/item-groups/${id}`, accessToken, { method: 'PUT', body: data }),

  delete: (accessToken: string, id: string, force = false) =>
    apiRequest<void>(`/item-groups/${id}`, accessToken, {
      method: 'DELETE',
      params: { force },
    }),
};
