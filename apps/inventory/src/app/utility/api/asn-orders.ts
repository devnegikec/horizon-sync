import type {
  AsnOrderClosePayload,
  AsnOrderResponse,
  AsnOrderSerialsResponse,
  AsnOrder856Response,
  AsnOrderEpcisResponse,
  AsnOrderTransferVerification,
} from '../../types/asn-order.types';
import type { AsnReceivingSummary } from '../../types/wms.types';

import { apiRequest, buildPaginationParams } from './core';

type AsnOrderFilters = {
  status?: string;
  warehouse_id?: string;
  source_warehouse_id?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  vehicle_no?: string;
  search?: string;
  asn_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

function buildAsnOrderListParams(page: number, pageSize: number, filters: AsnOrderFilters = {}) {
  const { sort_by = 'created_at', sort_order = 'desc', ...filterParams } = filters;
  return {
    ...buildPaginationParams(page, pageSize, sort_by, sort_order),
    ...filterParams,
  };
}

// ASN Orders API helpers
export const asnOrderApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters: AsnOrderFilters = {}) =>
    apiRequest('/asn-orders', accessToken, {
      params: buildAsnOrderListParams(page, pageSize, filters),
    }),

  get: (accessToken: string, id: string) => apiRequest(`/asn-orders/${id}`, accessToken),

  getReceivingSummary: (accessToken: string, id: string, sessionId?: string) =>
    apiRequest<AsnReceivingSummary>(`/asn-orders/${id}/receiving-summary`, accessToken, {
      params: sessionId ? { session_id: sessionId } : undefined,
    }),

  getSerials: (accessToken: string, id: string) =>
    apiRequest<AsnOrderSerialsResponse>(`/asn-orders/${id}/serials`, accessToken),

  getTransferVerification: (accessToken: string, id: string) =>
    apiRequest<AsnOrderTransferVerification>(`/asn-orders/${id}/transfer-verification`, accessToken),

  export856: (accessToken: string, id: string) =>
    apiRequest<AsnOrder856Response>(`/asn-orders/${id}/asn-856`, accessToken),

  exportEpcis: (accessToken: string, id: string) =>
    apiRequest<AsnOrderEpcisResponse>(`/asn-orders/${id}/epcis`, accessToken),

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

  /**
   * Formally close an ASN, accepting any outstanding shortfall.
   *
   * Always send a JSON object — `{}` closes a fully delivered ASN — so that
   * clients setting `Content-Type: application/json` without a body don't
   * misfire. Closing also writes off every open shortage balance on the ASN,
   * so refetch dependent widgets afterwards.
   */
  close: (accessToken: string, id: string, data: AsnOrderClosePayload = {}) =>
    apiRequest<AsnOrderResponse>(`/asn-orders/${id}/close`, accessToken, {
      method: 'POST',
      body: {
        reason_code: data.reason_code ?? null,
        note: data.note ?? null,
      },
    }),
};
