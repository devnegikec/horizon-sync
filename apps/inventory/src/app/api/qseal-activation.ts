import type {
  QSealActivationHistoryResponse,
  QSealActivationSettings,
  QSealActivationSettingsInput,
  QSealActivationSettingsSaveResponse,
  QSealActivationSummary,
  QSealDestinationMarketResponse,
} from '../types/qseal-activation.types';
import { apiRequest } from '../utility/api/core';

const activationPath = (productId: string) => `/qseal/products/${productId}/activation`;

export const qsealActivationApi = {
  getSummary: (accessToken: string, productId: string) => apiRequest<QSealActivationSummary>(`${activationPath(productId)}/summary`, accessToken),
  getCurrentSettings: (accessToken: string, productId: string) =>
    apiRequest<QSealActivationSettings>(`${activationPath(productId)}/settings`, accessToken),
  saveSettings: (accessToken: string, productId: string, data: QSealActivationSettingsInput) =>
    apiRequest<QSealActivationSettingsSaveResponse>(`${activationPath(productId)}/settings`, accessToken, { method: 'POST', body: data }),
  getHistory: (accessToken: string, productId: string, page = 1, pageSize = 20) =>
    apiRequest<QSealActivationHistoryResponse>(`${activationPath(productId)}/settings/history`, accessToken, {
      params: { page, page_size: pageSize },
    }),
  listDestinationMarkets: (accessToken: string) =>
    apiRequest<QSealDestinationMarketResponse>('/qr-activation/destination-markets', accessToken, { params: { page: 1, page_size: 100 } }),
};
