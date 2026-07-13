/**
 * QR Products API service
 * Endpoints: /api/v1/qr-products
 */

import { apiRequest, buildPaginationParams } from '../utility/api/core';
import type {
  QSealProduct,
  QSealProductListResponse,
  CreateQSealProductPayload,
  UpdateQSealProductPayload,
  ScanAnalyticsResponse,
} from '../types/qseal.types';

export const qrProductApi = {
  list(
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: { search?: string; is_active?: boolean },
  ): Promise<QSealProductListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(page, pageSize),
      search: filters?.search || undefined,
      is_active: filters?.is_active,
    };
    return apiRequest<QSealProductListResponse>('/qr-products', accessToken, { params });
  },

  getById(accessToken: string, productId: string): Promise<QSealProduct> {
    return apiRequest<QSealProduct>(`/qr-products/${productId}`, accessToken);
  },

  create(accessToken: string, data: CreateQSealProductPayload): Promise<QSealProduct> {
    return apiRequest<QSealProduct>('/qr-products', accessToken, {
      method: 'POST',
      body: data,
    });
  },

  update(accessToken: string, productId: string, data: UpdateQSealProductPayload): Promise<QSealProduct> {
    return apiRequest<QSealProduct>(`/qr-products/${productId}`, accessToken, {
      method: 'PATCH',
      body: data,
    });
  },

  delete(accessToken: string, productId: string): Promise<void> {
    return apiRequest<void>(`/qr-products/${productId}`, accessToken, {
      method: 'DELETE',
    });
  },

  getAnalytics(accessToken: string, productId: string): Promise<ScanAnalyticsResponse> {
    return apiRequest<ScanAnalyticsResponse>(`/qr-products/${productId}/analytics`, accessToken);
  },
};
