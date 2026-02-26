import type {
  PurchaseReceipt,
  PurchaseReceiptsResponse,
  CreatePurchaseReceiptPayload,
  PurchaseReceiptFilters,
} from '../../types/purchase-receipt.types';

const BASE_URL = 'http://localhost:8001/api/v1';

export const purchaseReceiptApi = {
  async list(accessToken: string, filters: Partial<PurchaseReceiptFilters> = {}): Promise<PurchaseReceiptsResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.reference_type) params.append('reference_type', filters.reference_type);
    if (filters.reference_id) params.append('reference_id', filters.reference_id);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await fetch(`${BASE_URL}/purchase-receipts?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to fetch purchase receipts');
    }

    return response.json();
  },

  async getById(accessToken: string, id: string): Promise<PurchaseReceipt> {
    const response = await fetch(`${BASE_URL}/purchase-receipts/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to fetch purchase receipt');
    }

    return response.json();
  },

  async create(accessToken: string, payload: CreatePurchaseReceiptPayload): Promise<PurchaseReceipt> {
    const response = await fetch(`${BASE_URL}/purchase-receipts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to create purchase receipt');
    }

    return response.json();
  },
};
