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

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001';

export const purchaseOrderApi = {
  /**
   * List Purchase Orders with pagination and filters
   * GET /api/v1/purchase-orders
   */
  list: async (accessToken: string, filters: Partial<PurchaseOrderFilters> = {}): Promise<PurchaseOrdersResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    // Only include status if it's not 'all' - backend doesn't accept 'all' as a value
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Purchase Orders: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get Purchase Order by ID
   * GET /api/v1/purchase-orders/{po_id}
   */
  getById: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create new Purchase Order
   * POST /api/v1/purchase-orders
   */
  create: async (accessToken: string, payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Update Purchase Order (DRAFT only)
   * PUT /api/v1/purchase-orders/{po_id}
   */
  update: async (accessToken: string, id: string, payload: UpdatePurchaseOrderPayload): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete Purchase Order (DRAFT only)
   * DELETE /api/v1/purchase-orders/{po_id}
   */
  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete Purchase Order: ${response.statusText}`);
    }
  },

  /**
   * Submit Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/submit
   */
  submit: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to submit Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Cancel Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/cancel
   */
  cancel: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Close Purchase Order
   * POST /api/v1/purchase-orders/{po_id}/close
   */
  close: async (accessToken: string, id: string): Promise<PurchaseOrder> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${id}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to close Purchase Order: ${response.statusText}`);
    }

    return response.json();
  },
};
