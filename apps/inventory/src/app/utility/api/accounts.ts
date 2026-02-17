import { apiRequest, buildPaginationParams } from './core';
import type {
  Account,
  AccountBalanceHistoryResponse,
  AuditTrailResponse,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '../../types/account.types';

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
      parent_account_id?: string;
    },
    sortBy = 'account_code',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(page, pageSize),
      sort_by: sortBy,
      sort_order: sortOrder,
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
    if (filters?.parent_account_id) {
      params.parent_account_id = filters.parent_account_id;
    }

    return apiRequest('/chart-of-accounts', accessToken, { params });
  },

  get: (accessToken: string, id: string) =>
    apiRequest<Account>(`/chart-of-accounts/${id}`, accessToken),

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

  // Balance operations
  getBalance: (accessToken: string, id: string, asOfDate?: string) => {
    const params: Record<string, string> = {};
    if (asOfDate) {
      params.as_of_date = asOfDate;
    }
    return apiRequest(`/chart-of-accounts/${id}/balance`, accessToken, { params });
  },

  getBalances: (accessToken: string, accountIds: string[], asOfDate?: string) =>
    apiRequest('/chart-of-accounts/balances', accessToken, {
      method: 'POST',
      body: {
        account_ids: accountIds,
        as_of_date: asOfDate,
      },
    }),

  getBalanceHistory: (accessToken: string, id: string, startDate: string, endDate: string) =>
    apiRequest<AccountBalanceHistoryResponse>(`/chart-of-accounts/${id}/balance/history`, accessToken, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }),

  // Audit trail operations
  getAuditTrail: (
    accessToken: string,
    id: string,
    filters?: {
      action?: string;
      start_date?: string;
      end_date?: string;
      page?: number;
      page_size?: number;
    }
  ) => {
    const params: Record<string, string | number> = {
      page: filters?.page || 1,
      page_size: filters?.page_size || 50,
    };

    if (filters?.action) {
      params.action = filters.action;
    }
    if (filters?.start_date) {
      params.start_date = filters.start_date;
    }
    if (filters?.end_date) {
      params.end_date = filters.end_date;
    }

    return apiRequest<AuditTrailResponse>(`/chart-of-accounts/${id}/audit-trail`, accessToken, { params });
  },
};
