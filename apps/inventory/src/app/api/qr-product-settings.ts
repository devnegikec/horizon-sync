/**
 * QR Product Settings API service
 * Endpoints: /api/v1/qr-product-settings
 */

import { apiRequest, buildPaginationParams } from '../utility/api/core';
import type {
  QRProductSetting,
  QRProductSettingCreate,
  QRProductSettingUpdate,
  QRProductSettingListResponse,
  SettingType,
} from '../types/qr-product-settings.types';

export const qrProductSettingApi = {
  list(
    accessToken: string,
    params?: {
      setting_type?: SettingType;
      is_active?: boolean;
      search?: string;
      page?: number;
      page_size?: number;
    },
  ): Promise<QRProductSettingListResponse> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(params?.page ?? 1, params?.page_size ?? 100),
      setting_type: params?.setting_type,
      is_active: params?.is_active,
      search: params?.search,
    };
    return apiRequest<QRProductSettingListResponse>('/qr-product-settings', accessToken, { params: queryParams });
  },

  getById(accessToken: string, id: string): Promise<QRProductSetting> {
    return apiRequest<QRProductSetting>(`/qr-product-settings/${id}`, accessToken);
  },

  create(accessToken: string, data: QRProductSettingCreate): Promise<QRProductSetting> {
    return apiRequest<QRProductSetting>('/qr-product-settings', accessToken, {
      method: 'POST',
      body: data,
    });
  },

  update(accessToken: string, id: string, data: QRProductSettingUpdate): Promise<QRProductSetting> {
    return apiRequest<QRProductSetting>(`/qr-product-settings/${id}`, accessToken, {
      method: 'PATCH',
      body: data,
    });
  },

  delete(accessToken: string, id: string): Promise<void> {
    return apiRequest<void>(`/qr-product-settings/${id}`, accessToken, {
      method: 'DELETE',
    });
  },
};
