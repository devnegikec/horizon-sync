import { apiRequest, buildPaginationParams } from './core';

// ASN Orders API helpers
export const asnOrderApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { status?: string; warehouse_id?: string; source_warehouse_id?: string; delivery_date_from?: string; delivery_date_to?: string; vehicle_no?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/asn-orders', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'created_at', filters?.sort_order || 'desc'),
        status: filters?.status,
        warehouse_id: filters?.warehouse_id,
        source_warehouse_id: filters?.source_warehouse_id,
        delivery_date_from: filters?.delivery_date_from,
        delivery_date_to: filters?.delivery_date_to,
        vehicle_no: filters?.vehicle_no,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/asn-orders/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/asn-orders', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/asn-orders/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/asn-orders/${id}`, accessToken, {
      method: 'DELETE',
    }),

  updateStatus: (accessToken: string, id: string, data: { status: string }) =>
    apiRequest(`/asn-orders/${id}/status`, accessToken, {
      method: 'PUT',
      body: data,
    }),
};
