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
import { apiRequest, buildPaginationParams } from './core';

export const landedCostApi = {
  /**
   * List Landed Cost Vouchers with pagination and filters
   * GET /api/v1/landed-cost
   */
  list: async (accessToken: string, filters: Partial<LandedCostVoucherFilters> = {}): Promise<LandedCostVouchersResponse> => {
    return apiRequest<LandedCostVouchersResponse>('/landed-cost', accessToken, {
      params: {
        ...(filters.page && { page: filters.page }),
        ...(filters.page_size && { page_size: filters.page_size }),
        // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
      },
    });
  },

  /**
   * Get Landed Cost Voucher by ID
   * GET /api/v1/landed-cost/{voucher_id}
   */
  getById: async (accessToken: string, id: string): Promise<LandedCostVoucher> => {
    return apiRequest<LandedCostVoucher>(`/landed-cost/${id}`, accessToken);
  },

  /**
   * Create new Landed Cost Voucher
   * POST /api/v1/landed-cost
   */
  create: async (accessToken: string, payload: CreateLandedCostVoucherPayload): Promise<LandedCostVoucher> => {
    return apiRequest<LandedCostVoucher>('/landed-cost', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update Landed Cost Voucher
   * PUT /api/v1/landed-cost/{voucher_id}
   */
  update: async (accessToken: string, id: string, payload: UpdateLandedCostVoucherPayload): Promise<LandedCostVoucher> => {
    return apiRequest<LandedCostVoucher>(`/landed-cost/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete Landed Cost Voucher
   * DELETE /api/v1/landed-cost/{voucher_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    return apiRequest<void>(`/landed-cost/${id}`, accessToken, {
      method: 'DELETE',
    });
  },
};
