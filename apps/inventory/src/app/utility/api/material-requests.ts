/**
 * Material Request API Client
 * Based on backend implementation: core-service/app/api/v1/endpoints/material_requests.py
 */

import type {
  CreateMaterialRequestPayload,
  UpdateMaterialRequestPayload,
  MaterialRequest,
  MaterialRequestsResponse,
  MaterialRequestFilters,
} from '../../types/material-request.types';
import { apiRequest, buildPaginationParams } from './core';

export const materialRequestApi = {
  /**
   * List Material Requests with pagination and filters
   * GET /api/v1/material-requests
   */
  list: async (accessToken: string, filters: Partial<MaterialRequestFilters> = {}): Promise<MaterialRequestsResponse> => {
    return apiRequest<MaterialRequestsResponse>('/material-requests', accessToken, {
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
   * Get Material Request by ID
   * GET /api/v1/material-requests/{material_request_id}
   */
  getById: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    return apiRequest<MaterialRequest>(`/material-requests/${id}`, accessToken);
  },

  /**
   * Create new Material Request
   * POST /api/v1/material-requests
   */
  create: async (accessToken: string, payload: CreateMaterialRequestPayload): Promise<MaterialRequest> => {
    return apiRequest<MaterialRequest>('/material-requests', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update Material Request (DRAFT only)
   * PUT /api/v1/material-requests/{material_request_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateMaterialRequestPayload): Promise<MaterialRequest> => {
    return apiRequest<MaterialRequest>(`/material-requests/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete Material Request (DRAFT only)
   * DELETE /api/v1/material-requests/{material_request_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    return apiRequest<void>(`/material-requests/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Submit Material Request
   * POST /api/v1/material-requests/{material_request_id}/submit
   */
  submit: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/submit`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Cancel Material Request
   * POST /api/v1/material-requests/{material_request_id}/cancel
   */
  cancel: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/cancel`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Approve Material Request (not in backend yet, placeholder)
   */
  approve: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    console.warn('[materialRequestApi] approve() not implemented in backend yet');
    return Promise.reject(new Error('Material Request approve API not implemented'));
  },

  /**
   * Reject Material Request (not in backend yet, placeholder)
   */
  reject: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    console.warn('[materialRequestApi] reject() not implemented in backend yet');
    return Promise.reject(new Error('Material Request reject API not implemented'));
  },
};
