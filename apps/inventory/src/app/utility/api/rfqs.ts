/**
 * RFQ API Client
 * Based on backend implementation: core-service/app/api/v1/endpoints/rfqs.py
 */

import type {
  CreateRFQPayload,
  UpdateRFQPayload,
  RFQ,
  RFQsResponse,
  RFQFilters,
  RecordQuotePayload,
} from '../../types/rfq.types';
import { apiRequest } from './core';

export const rfqApi = {
  /**
   * List RFQs with pagination and filters
   * GET /api/v1/rfqs
   */
  list: async (accessToken: string, filters: Partial<RFQFilters> = {}): Promise<RFQsResponse> => {
    return apiRequest<RFQsResponse>('/rfqs', accessToken, {
      params: {
        ...(filters.page && { page: filters.page }),
        ...(filters.page_size && { page_size: filters.page_size }),
        // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
        ...(filters.search && { search: filters.search }),
      },
    });
  },

  /**
   * Get RFQ by ID
   * GET /api/v1/rfqs/{rfq_id}
   */
  getById: async (accessToken: string, id: string): Promise<RFQ> => {
    return apiRequest<RFQ>(`/rfqs/${id}`, accessToken);
  },

  /**
   * Create new RFQ
   * POST /api/v1/rfqs
   */
  create: async (accessToken: string, payload: CreateRFQPayload): Promise<RFQ> => {
    return apiRequest<RFQ>('/rfqs', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update RFQ (DRAFT only)
   * PUT /api/v1/rfqs/{rfq_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateRFQPayload): Promise<RFQ> => {
    return apiRequest<RFQ>(`/rfqs/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete RFQ (DRAFT only)
   * DELETE /api/v1/rfqs/{rfq_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    return apiRequest<void>(`/rfqs/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Send RFQ to suppliers
   * POST /api/v1/rfqs/{rfq_id}/send
   */
  send: async (accessToken: string, id: string): Promise<RFQ> => {
    return apiRequest<RFQ>(`/rfqs/${id}/send`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Record supplier quote for RFQ line item
   * POST /api/v1/rfqs/{rfq_id}/quotes
   */
  recordQuote: async (accessToken: string, id: string, payload: RecordQuotePayload): Promise<RFQ> => {
    return apiRequest<RFQ>(`/rfqs/${id}/quotes`, accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Close RFQ
   * POST /api/v1/rfqs/{rfq_id}/close
   */
  close: async (accessToken: string, id: string): Promise<RFQ> => {
    return apiRequest<RFQ>(`/rfqs/${id}/close`, accessToken, {
      method: 'POST',
    });
  },
};
