/**
 * QR Products API service
 * Endpoints: /api/v1/qr-products
 */

import type {
  QSealProduct,
  QSealProductListResponse,
  CreateQSealProductPayload,
  UpdateQSealProductPayload,
  ScanAnalyticsResponse,
  QSealProductImageResponse,
  QSealProductImageType,
} from '../types/qseal.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

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

  uploadImage(
    accessToken: string,
    productId: string,
    imageType: QSealProductImageType,
    file: File,
  ): Promise<QSealProductImageResponse> {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<QSealProductImageResponse>(
      `/qr-products/${productId}/images/${imageType}`,
      accessToken,
      { method: 'POST', body },
    );
  },

  removeImage(
    accessToken: string,
    productId: string,
    imageType: QSealProductImageType,
  ): Promise<QSealProductImageResponse> {
    return apiRequest<QSealProductImageResponse>(
      `/qr-products/${productId}/images/${imageType}`,
      accessToken,
      { method: 'DELETE' },
    );
  },

  getAnalytics(accessToken: string, productId: string): Promise<ScanAnalyticsResponse> {
    return apiRequest<ScanAnalyticsResponse>(`/qr-products/${productId}/analytics`, accessToken);
  },
};
