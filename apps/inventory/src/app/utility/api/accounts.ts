import { apiRequest, buildPaginationParams } from './core';
import type { CreateAccountPayload, UpdateAccountPayload } from '../../types/account.types';

export const accountApi = {
  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: {
      search?: string;
      account_type?: string;
      status?: string;
      currency?: string;
    }
  ) => {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(page, pageSize),
    };

    if (filters?.search) {
      params.search = filters.search;
    }
    if (filters?.account_type && filters.account_type !== 'all') {
      params.account_type = filters.account_type;
    }
    if (filters?.status && filters.status !== 'all') {
      params.is_active = filters.status === 'active' ? 'true' : 'false';
    }
    if (filters?.currency && filters.currency !== 'all') {
      params.currency = filters.currency;
    }

    return apiRequest('/chart-of-accounts', accessToken, { params });
  },

  get: (accessToken: string, id: string) =>
    apiRequest(`/chart-of-accounts/${id}`, accessToken),

  create: (accessToken: string, data: CreateAccountPayload) =>
    apiRequest('/chart-of-accounts', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: UpdateAccountPayload) =>
    apiRequest(`/chart-of-accounts/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/chart-of-accounts/${id}`, accessToken, {
      method: 'DELETE',
    }),

  activate: (accessToken: string, id: string) =>
    apiRequest(`/chart-of-accounts/${id}/activate`, accessToken, {
      method: 'PUT',
    }),

  deactivate: (accessToken: string, id: string) =>
    apiRequest(`/chart-of-accounts/${id}/deactivate`, accessToken, {
      method: 'PUT',
    }),
};
