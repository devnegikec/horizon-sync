/**
 * Purchase Order API Client
 * Based on backend implementation: core-service/app/api/v1/endpoints/purchase_orders.py
 */

import type {
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  PurchaseOrder,
  PurchaseOrdersResponse,
  PurchaseOrderFilters,
} from '../../types/purchase-order.types';
import { apiRequest } from './core';

export const purchaseOrderApi = {
  /**
   * List Purchase Orders with pagination and filters
   * GET /api/v1/purchase-orders
   */
  list: async (accessToken: string, filters: Partial<PurchaseOrderFilters> = {}): Promise<PurchaseOrdersResponse> => {
    return apiRequest<PurchaseOrdersResponse>('/purchase-orders', accessToken, {
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
   * Get Purchase Order by ID
   * GET /api/v1/purchase-orders/{po_id}
   */
  getById: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, accessToken);
  },

  /**
   * Create new Purchase Order
   * POST /api/v1/purchase-orders
   */
  create: async (accessToken: string, payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>('/purchase-orders', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update Purchase Order (DRAFT only)
   * PUT /api/v1/purchase-orders/{po_id}
   */
  update: async (accessToken: string, id: string, payload: UpdatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>(`/purchase-orders/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete Purchase Order (DRAFT only)
   * DELETE /api/v1/purchase-orders/{po_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    return apiRequest<void>(`/purchase-orders/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Submit Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/submit
   */
  submit: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/submit`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Cancel Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/cancel
   */
  cancel: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/cancel`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Close Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/close
   */
  close: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    return apiRequest<PurchaseOrder>(`/purchase-orders/${id}/close`, accessToken, {
      method: 'POST',
    });
  },
};
