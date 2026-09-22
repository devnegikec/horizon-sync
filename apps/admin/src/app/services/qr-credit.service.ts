import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  QRCreditAddRequest,
  QRCreditBalance,
  QRCreditLedgerResponse,
} from '../types/qr-credit.types';

const API_CORE_URL = environment.apiCoreUrl;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useUserStore.getState().accessToken;
  const response = await fetch(`${API_CORE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let message = `Credit request failed (${response.status})`;
    try {
      const payload = await response.json() as {
        detail?: string | { message?: string };
      };
      if (typeof payload.detail === 'string') message = payload.detail;
      if (typeof payload.detail === 'object' && payload.detail?.message) {
        message = payload.detail.message;
      }
    } catch {
      // Keep the status-based fallback when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const qrCreditService = {
  getBalance(organizationId: string) {
    return request<QRCreditBalance>(
      `/api/v1/qr-credits/organizations/${organizationId}`,
    );
  },

  getLedger(organizationId: string, pageSize = 10) {
    return request<QRCreditLedgerResponse>(
      `/api/v1/qr-credits/organizations/${organizationId}/ledger?page=1&page_size=${pageSize}`,
    );
  },

  addCredits(organizationId: string, data: QRCreditAddRequest) {
    return request<QRCreditBalance>(
      `/api/v1/qr-credits/organizations/${organizationId}/add`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },
};
