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

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001';

export const materialRequestApi = {
  /**
   * List Material Requests with pagination and filters
   * GET /api/v1/material-requests
   */
  list: async (accessToken: string, filters: Partial<MaterialRequestFilters> = {}): Promise<MaterialRequestsResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Material Requests: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get Material Request by ID
   * GET /api/v1/material-requests/{material_request_id}
   */
  getById: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Material Request: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new Material Request
   * POST /api/v1/material-requests
   */
  create: async (accessToken: string, payload: CreateMaterialRequestPayload): Promise<MaterialRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Material Request: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update Material Request (DRAFT only)
   * PUT /api/v1/material-requests/{material_request_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateMaterialRequestPayload): Promise<MaterialRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Material Request: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete Material Request (DRAFT only)
   * DELETE /api/v1/material-requests/{material_request_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Material Request: ${response.statusText}`);
    }
  },

  /**
   * Submit Material Request
   * POST /api/v1/material-requests/{material_request_id}/submit
   */
  submit: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests/${id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to submit Material Request: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Cancel Material Request
   * POST /api/v1/material-requests/{material_request_id}/cancel
   */
  cancel: async (accessToken: string, id: string): Promise<MaterialRequest> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/material-requests/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel Material Request: ${response.statusText}`);
    }

    return response.json();
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
