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

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001';

export const rfqApi = {
  /**
   * List RFQs with pagination and filters
   * GET /api/v1/rfqs
   */
  list: async (accessToken: string, filters: Partial<RFQFilters> = {}): Promise<RFQsResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RFQs: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get RFQ by ID
   * GET /api/v1/rfqs/{rfq_id}
   */
  getById: async (accessToken: string, id: string): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RFQ: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new RFQ
   * POST /api/v1/rfqs
   */
  create: async (accessToken: string, payload: CreateRFQPayload): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create RFQ: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update RFQ (DRAFT only)
   * PUT /api/v1/rfqs/{rfq_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateRFQPayload): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update RFQ: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete RFQ (DRAFT only)
   * DELETE /api/v1/rfqs/{rfq_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete RFQ: ${response.statusText}`);
    }
  },

  /**
   * Send RFQ to suppliers
   * POST /api/v1/rfqs/{rfq_id}/send
   */
  send: async (accessToken: string, id: string): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to send RFQ: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Record supplier quote for RFQ line item
   * POST /api/v1/rfqs/{rfq_id}/quotes
   */
  recordQuote: async (accessToken: string, id: string, payload: RecordQuotePayload): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}/quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to record quote: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Close RFQ
   * POST /api/v1/rfqs/{rfq_id}/close
   */
  close: async (accessToken: string, id: string): Promise<RFQ> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rfqs/${id}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to close RFQ: ${response.statusText}`);
    }

    return response.json();
  },
};
