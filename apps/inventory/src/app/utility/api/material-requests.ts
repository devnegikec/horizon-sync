import { apiRequest, buildPaginationParams } from './core';

import type {
  MaterialRequest,
  MaterialRequestListResponse,
  CreateMaterialRequestPayload,
  UpdateMaterialRequestPayload,
  MaterialRequestFilters,
} from '../../types/material-requests.types';

export const materialRequestApi = {
  /**
   * List material requests with pagination and filters
   */
  async list(accessToken: string, filters: Partial<MaterialRequestFilters> = {}): Promise<MaterialRequestListResponse> {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(
        filters.page || 1,
        filters.page_size || 10,
        filters.sort_by || 'created_at',
        filters.sort_order || 'desc'
      ),
    };

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    const response = await apiRequest<any>('/material-requests', accessToken, { params });
    
    // Backend returns: { material_requests: [], pagination: {} }
    // Transform to: { data: [], total_count: number, page: number, page_size: number }
    if (response.material_requests && response.pagination) {
      // Transform material requests
      const materialRequests = response.material_requests.map((mr: any) => ({
        ...mr,
        // Keep line_items_count for display, add empty line_items array
        line_items: mr.line_items || [],
        line_items_count: mr.line_items_count || 0,
        status: mr.status?.toUpperCase() || 'DRAFT',
        updated_at: mr.updated_at || mr.created_at,
      }));

      return {
        data: materialRequests,
        total_count: response.pagination.total_items,
        page: response.pagination.page,
        page_size: response.pagination.page_size,
      };
    }
    
    // Fallback: return as-is if already in expected format
    return {
      data: response.data || [],
      total_count: response.total_count || 0,
      page: response.page || 1,
      page_size: response.page_size || 10,
    };
  },

  /**
   * Get a single material request by ID
   */
  async getById(accessToken: string, id: string): Promise<MaterialRequest> {
    const response = await apiRequest<any>(`/material-requests/${id}`, accessToken);
    
    // Transform response to ensure consistent format
    return {
      ...response,
      status: response.status?.toUpperCase() || 'DRAFT',
      updated_at: response.updated_at || response.created_at,
      line_items: response.line_items || [],
    };
  },

  /**
   * Create a new material request
   */
  async create(accessToken: string, payload: CreateMaterialRequestPayload): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>('/material-requests', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update an existing material request (DRAFT only)
   */
  async update(accessToken: string, id: string, payload: UpdateMaterialRequestPayload): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete a material request (DRAFT only)
   */
  async delete(accessToken: string, id: string): Promise<void> {
    return apiRequest<void>(`/material-requests/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Submit a material request
   */
  async submit(accessToken: string, id: string): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/submit`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Cancel a material request
   */
  async cancel(accessToken: string, id: string): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/cancel`, accessToken, {
      method: 'POST',
    });
  },
};