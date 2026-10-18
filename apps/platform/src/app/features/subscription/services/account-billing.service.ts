import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';
import type {
  AccountCredits,
  AccountInvoiceListResponse,
  AccountSubscription,
  CreditBatchListResponse,
  CreditLedgerListResponse,
  ExpirationsResponse,
  TopupOrder,
  TopupQuote,
} from '../types';

const API_CORE_URL = environment.apiCoreUrl;

export class BillingApiError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'BillingApiError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_QUOTE: 'This quote has expired. Request a new one.',
  INSUFFICIENT_CREDITS: 'Not enough credits available.',
  SUBSCRIPTION_INACTIVE: 'Your subscription is not active. Contact support to continue.',
  TENANT_MISMATCH: 'This record belongs to a different organization.',
  PLAN_NOT_FOUND: 'That plan could not be found.',
  IDEMPOTENCY_CONFLICT: 'This request was already submitted with different values. Please reload.',
};

interface ErrorBody {
  detail?: string | { code?: string; message?: string };
}

function errorCode(detail: ErrorBody['detail']): string | undefined {
  return typeof detail === 'object' && detail !== null ? detail.code : undefined;
}

function errorMessage(detail: ErrorBody['detail']): string | undefined {
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object' && detail !== null) return detail.message;
  return undefined;
}

async function readError(response: Response): Promise<BillingApiError> {
  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }
  const detail = body?.detail;
  const code = errorCode(detail);
  const message = (code && ERROR_MESSAGES[code]) || errorMessage(detail) || `Request failed (${response.status})`;
  return new BillingApiError(message, { code, status: response.status });
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useUserStore.getState().accessToken;
  const response = await fetch(`${API_CORE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function createIdempotencyKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const AccountBillingService = {
  getSubscription() {
    return request<AccountSubscription>('/api/v1/account/subscription');
  },

  getCredits() {
    return request<AccountCredits>('/api/v1/account/credits');
  },

  getBatches(params: { status?: string; page?: number; page_size?: number } = {}) {
    return request<CreditBatchListResponse>(`/api/v1/account/credits/batches${buildQuery({ ...params })}`);
  },

  getLedger(params: { type?: string; from?: string; to?: string; page?: number; page_size?: number } = {}) {
    return request<CreditLedgerListResponse>(
      `/api/v1/account/credits/ledger${buildQuery({
        type: params.type,
        from_date: params.from,
        to_date: params.to,
        page: params.page,
        page_size: params.page_size,
      })}`,
    );
  },

  getExpirations() {
    return request<ExpirationsResponse>('/api/v1/account/credits/expirations');
  },

  getInvoices(params: { status?: string; page?: number; page_size?: number } = {}) {
    return request<AccountInvoiceListResponse>(`/api/v1/account/invoices${buildQuery({ ...params })}`);
  },

  createQuote(credits: string) {
    return request<TopupQuote>('/api/v1/account/topups/quotes', {
      method: 'POST',
      body: JSON.stringify({ credits }),
    });
  },

  createOrder(quoteId: string, idempotencyKey: string, provider?: string) {
    return request<TopupOrder>('/api/v1/account/topups/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ quote_id: quoteId, ...(provider ? { provider } : {}) }),
    });
  },

  getOrder(orderId: string) {
    return request<TopupOrder>(`/api/v1/account/topups/orders/${orderId}`);
  },

  // ── Ops-only plan change (used when the signed-in user holds system_admin billing rights) ──

  listPlans() {
    return request<{
      items: Array<{
        id: string;
        code: string;
        name: string;
        currency: string;
        published_version: { id: string; version: number; billing_cadence: string; base_price: string; id_weight: string } | null;
      }>;
    }>('/api/v1/admin/subscription-plans?active=true&page=1&page_size=100');
  },

  changePlan(organizationId: string, payload: { plan_version_id: string; effective_from?: string; reason: string }, idempotencyKey: string) {
    return request<unknown>(`/api/v1/admin/organizations/${organizationId}/subscription`, {
      method: 'PATCH',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },
};
