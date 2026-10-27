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

/** File formats supported by the QR product bulk export/template endpoints. */
export type QrProductBulkFormat = 'csv' | 'xlsx';

/** A single rejected row returned by the bulk import endpoint. */
export interface QrProductImportRowError {
  row: number;
  sku?: string | null;
  message: string;
}

/** Summary returned by `POST /qr-products/import`. */
export interface QrProductImportResult {
  total_rows: number;
  created: number;
  updated: number;
  failed: number;
  errors: QrProductImportRowError[];
}

export interface QrProductExportParams {
  format: QrProductBulkFormat;
  /** Filter exported rows by active state. */
  is_active?: boolean;
  /** Free-text filter (name / sku / gtin). */
  search?: string;
}

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

  /** Download all (filtered) QR products as a CSV or Excel file. */
  exportBulk(accessToken: string, params: QrProductExportParams): Promise<Blob> {
    return apiRequest<Blob>('/qr-products/export', accessToken, {
      params: {
        format: params.format,
        is_active: params.is_active,
        search: params.search || undefined,
      },
      responseType: 'blob',
    });
  },

  /** Download the blank import template (CSV or Excel). */
  downloadImportTemplate(accessToken: string, format: QrProductBulkFormat = 'csv'): Promise<Blob> {
    return apiRequest<Blob>('/qr-products/import/template', accessToken, {
      params: { format },
      responseType: 'blob',
    });
  },

  /** Upload a CSV/Excel file to create or update QR products (matched on SKU). */
  importBulk(accessToken: string, file: File): Promise<QrProductImportResult> {
    const body = new FormData();
    body.append('file', file);
    return apiRequest<QrProductImportResult>('/qr-products/import', accessToken, {
      method: 'POST',
      body,
    });
  },
};
