import { apiRequest, buildPaginationParams } from './core';
// RFQ API helpers
import type {
  RFQ,
  RFQListResponse,
  RFQListItem,
  CreateRFQPayload,
  UpdateRFQPayload,
  RecordQuotePayload,
  RFQFilters,
  RFQStatus,
} from '../../types/rfq.types';

/**
 * Transform backend status (lowercase) to frontend status (uppercase)
 */
function transformStatus(status: string): RFQStatus {
  return status.toUpperCase() as RFQStatus;
}

/**
 * Transform backend RFQ response to frontend RFQ type
 */
function transformRFQ(rfq: any): RFQ {
  return {
    ...rfq,
    status: transformStatus(rfq.status),
    // Extract supplier IDs from suppliers array for convenience
    supplier_ids: rfq.suppliers?.map((s: any) => s.supplier_id) || [],
    // Ensure arrays exist
    line_items: rfq.line_items || [],
    suppliers: rfq.suppliers || [],
  };
}

/**
 * Transform backend RFQ list item to frontend type
 */
function transformListItem(item: any): RFQListItem {
  return {
    ...item,
    status: transformStatus(item.status),
  };
}

export const rfqApi = {
  /**
   * List RFQs with pagination and filters
   */
  async list(accessToken: string, filters: Partial<RFQFilters> = {}): Promise<RFQListResponse> {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(
        filters.page || 1,
        filters.page_size || 10,
        filters.sort_by || 'created_at',
        filters.sort_order || 'desc'
      ),
    };

    if (filters.status && filters.status !== 'all') {
      // Backend expects lowercase status
      params.status = filters.status.toLowerCase();
    }

    if (filters.search) {
      params.search = filters.search;
    }

    const response = await apiRequest<any>('/rfqs', accessToken, { params });
    
    // Backend returns: { rfqs: [], pagination: {} }
    if (response.rfqs && response.pagination) {
      return {
        data: response.rfqs.map(transformListItem),
        total_count: response.pagination.total_items,
        page: response.pagination.page,
        page_size: response.pagination.page_size,
      };
    }
    
    // Fallback: return empty if format is unexpected
    return {
      data: [],
      total_count: 0,
      page: 1,
      page_size: 10,
    };
  },

  /**
   * Get a single RFQ by ID
   */
  async getById(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}`, accessToken);
    return transformRFQ(response);
  },

  /**
   * Create a new RFQ
   */
  async create(accessToken: string, payload: CreateRFQPayload): Promise<RFQ> {
    const response = await apiRequest<any>('/rfqs', accessToken, {
      method: 'POST',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Update an existing RFQ (DRAFT only)
   */
  async update(accessToken: string, id: string, payload: UpdateRFQPayload): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Delete an RFQ (DRAFT only)
   */
  async delete(accessToken: string, id: string): Promise<void> {
    return apiRequest<void>(`/rfqs/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Send RFQ to suppliers
   */
  async send(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/send`, accessToken, {
      method: 'POST',
    });
    return transformRFQ(response);
  },

  /**
   * Record a supplier quote
   */
  async recordQuote(accessToken: string, id: string, payload: RecordQuotePayload): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/quotes`, accessToken, {
      method: 'POST',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Close an RFQ
   */
  async close(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/close`, accessToken, {
      method: 'POST',
    });
    return transformRFQ(response);
  },
};