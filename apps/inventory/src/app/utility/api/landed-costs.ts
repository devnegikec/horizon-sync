/**
 * Landed Cost API Client
 * Based on backend implementation: core-service/app/api/v1/endpoints/landed_cost.py
 */

import type {
  LandedCostVoucher,
  LandedCostVouchersResponse,
  CreateLandedCostVoucherPayload,
  UpdateLandedCostVoucherPayload,
  LandedCostVoucherFilters,
} from '../../types/landed-cost.types';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001';

export const landedCostApi = {
  /**
   * List Landed Cost Vouchers with pagination and filters
   * GET /api/v1/landed-cost
   */
  list: async (accessToken: string, filters: Partial<LandedCostVoucherFilters> = {}): Promise<LandedCostVouchersResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await fetch(`${API_BASE_URL}/api/v1/landed-cost?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Landed Cost Vouchers: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get Landed Cost Voucher by ID
   * GET /api/v1/landed-cost/{voucher_id}
   */
  getById: async (accessToken: string, id: string): Promise<LandedCostVoucher> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/landed-cost/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Landed Cost Voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new Landed Cost Voucher
   * POST /api/v1/landed-cost
   */
  create: async (accessToken: string, payload: CreateLandedCostVoucherPayload): Promise<LandedCostVoucher> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/landed-cost`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Landed Cost Voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update Landed Cost Voucher
   * PUT /api/v1/landed-cost/{voucher_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateLandedCostVoucherPayload): Promise<LandedCostVoucher> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/landed-cost/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Landed Cost Voucher: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete Landed Cost Voucher
   * DELETE /api/v1/landed-cost/{voucher_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/landed-cost/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Landed Cost Voucher: ${response.statusText}`);
    }
  },
};
