import type {
  PurchaseReceipt,
  PurchaseReceiptsResponse,
  CreatePurchaseReceiptPayload,
  PurchaseReceiptFilters,
} from '../../types/purchase-receipt.types';
import { apiRequest, buildPaginationParams } from './core';

export const purchaseReceiptApi = {
  async list(accessToken: string, filters: Partial<PurchaseReceiptFilters> = {}): Promise<PurchaseReceiptsResponse> {
    return apiRequest<PurchaseReceiptsResponse>('/purchase-receipts', accessToken, {
      params: {
        ...(filters.page && { page: filters.page }),
        ...(filters.page_size && { page_size: filters.page_size }),
        ...(filters.reference_type && { reference_type: filters.reference_type }),
        ...(filters.reference_id && { reference_id: filters.reference_id }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order }),
      },
    });
  },

  async getById(accessToken: string, id: string): Promise<PurchaseReceipt> {
    return apiRequest<PurchaseReceipt>(`/purchase-receipts/${id}`, accessToken);
  },

  async create(accessToken: string, payload: CreatePurchaseReceiptPayload): Promise<PurchaseReceipt> {
    return apiRequest<PurchaseReceipt>('/purchase-receipts', accessToken, {
      method: 'POST',
      body: payload,
    });
  },
};
