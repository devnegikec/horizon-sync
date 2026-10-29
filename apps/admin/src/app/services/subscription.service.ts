import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { QRCreditBalance, QRCreditLedgerResponse } from '../types/qr-credit.types';
import type {
  ChangeSubscriptionPayload,
  CreatePlanPayload,
  CreateSubscriptionPayload,
  CreditAdjustmentPayload,
  CreditBatchListResponse,
  CreditExposureResponse,
  OrganizationSubscription,
  PlanVersionPayload,
  ReconciliationResponse,
  SubscriptionPlan,
  SubscriptionPlanDetail,
  SubscriptionPlanListFilters,
  SubscriptionPlanListResponse,
} from '../types/subscription.types';

const API_CORE_URL = environment.apiCoreUrl;

/** Machine-readable error raised by the subscription/billing API. */
export class SubscriptionApiError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly context?: Record<string, unknown>;

  constructor(message: string, options?: { code?: string; status?: number; context?: Record<string, unknown> }) {
    super(message);
    this.name = 'SubscriptionApiError';
    this.code = options?.code;
    this.status = options?.status;
    this.context = options?.context;
  }
}

/** Friendly copy for the stable machine-readable codes documented in the API guide. */
const ERROR_MESSAGES: Record<string, string> = {
  PLAN_CODE_EXISTS: 'A plan with this code already exists for that scope.',
  VERSION_NOT_DRAFT: 'This version is no longer a draft. Create a new version instead.',
  EFFECTIVE_RANGE_OVERLAP: 'Another published version already covers this period.',
  ID_WEIGHT_INVALID: 'ID weight must be greater than zero.',
  ID_WEIGHT_MUST_BE_POSITIVE: 'ID weight must be greater than zero.',
  IDEMPOTENCY_CONFLICT: 'This change was already submitted with different values. Reload and try again.',
  INSUFFICIENT_BALANCE: 'The adjustment would take the balance below zero.',
  INSUFFICIENT_CREDITS: 'Not enough credits available.',
  SUBSCRIPTION_INACTIVE: 'The organization subscription is not active.',
  ORGANIZATION_SUSPENDED: 'The organization is suspended.',
  TENANT_MISMATCH: 'This record belongs to a different organization.',
  PLAN_NOT_FOUND: 'That plan or version could not be found.',
  INVALID_QUOTE: 'This quote has expired. Request a new one.',
  OPERATION_IN_PROGRESS: 'Another operation is still in progress. Try again shortly.',
};

interface ErrorBody {
  detail?: string | { code?: string; message?: string; context?: Record<string, unknown> };
}

type ErrorDetail = ErrorBody['detail'];

function errorCode(detail: ErrorDetail): string | undefined {
  return typeof detail === 'object' && detail !== null ? detail.code : undefined;
}

function errorMessage(detail: ErrorDetail): string | undefined {
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object' && detail !== null) return detail.message;
  return undefined;
}

function errorContext(detail: ErrorDetail): Record<string, unknown> | undefined {
  return typeof detail === 'object' && detail !== null ? detail.context : undefined;
}

async function readError(response: Response): Promise<SubscriptionApiError> {
  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }

  const detail = body?.detail;
  const code = errorCode(detail);
  const message = (code && ERROR_MESSAGES[code]) || errorMessage(detail) || `Request failed (${response.status})`;

  return new SubscriptionApiError(message, { code, status: response.status, context: errorContext(detail) });
}

function buildQuery(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
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

/** Creates a new UUID for an idempotency key. */
export function createIdempotencyKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const SubscriptionService = {
  // ── Plan catalog ───────────────────────────────────────────────────────────

  listPlans(filters: SubscriptionPlanListFilters = {}) {
    return request<SubscriptionPlanListResponse>(`/api/v1/admin/subscription-plans${buildQuery({ ...filters })}`);
  },

  createPlan(payload: CreatePlanPayload, idempotencyKey: string) {
    return request<SubscriptionPlan>('/api/v1/admin/subscription-plans', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  getPlan(planId: string) {
    return request<SubscriptionPlanDetail>(`/api/v1/admin/subscription-plans/${planId}`);
  },

  createVersion(planId: string, payload: PlanVersionPayload, idempotencyKey: string) {
    return request<SubscriptionPlanDetail>(`/api/v1/admin/subscription-plans/${planId}/versions`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  updateVersion(planId: string, versionId: string, payload: Partial<PlanVersionPayload>, idempotencyKey: string) {
    return request<SubscriptionPlanDetail>(`/api/v1/admin/subscription-plans/${planId}/versions/${versionId}`, {
      method: 'PATCH',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  approveVersion(planId: string, versionId: string, idempotencyKey: string) {
    return request<SubscriptionPlanDetail>(
      `/api/v1/admin/subscription-plans/${planId}/versions/${versionId}/approve`,
      { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
    );
  },

  publishVersion(planId: string, versionId: string, effectiveFrom: string | undefined, idempotencyKey: string) {
    return request<SubscriptionPlanDetail>(
      `/api/v1/admin/subscription-plans/${planId}/versions/${versionId}/publish`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(effectiveFrom ? { effective_from: effectiveFrom } : {}),
      },
    );
  },

  retireVersion(planId: string, versionId: string, effectiveTo: string | undefined, idempotencyKey: string) {
    return request<SubscriptionPlanDetail>(
      `/api/v1/admin/subscription-plans/${planId}/versions/${versionId}/retire`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(effectiveTo ? { effective_to: effectiveTo } : {}),
      },
    );
  },

  // ── Organization subscription lifecycle ────────────────────────────────────

  getSubscription(organizationId: string) {
    return request<OrganizationSubscription>(`/api/v1/admin/organizations/${organizationId}/subscription`);
  },

  createSubscription(organizationId: string, payload: CreateSubscriptionPayload, idempotencyKey: string) {
    return request<OrganizationSubscription>(`/api/v1/admin/organizations/${organizationId}/subscription`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  activateSubscription(
    organizationId: string,
    payload: { payment_reference: string; amount?: string; provider?: string },
    idempotencyKey: string,
  ) {
    return request<OrganizationSubscription>(`/api/v1/admin/organizations/${organizationId}/subscription/activate`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  changeSubscription(organizationId: string, payload: ChangeSubscriptionPayload, idempotencyKey: string) {
    return request<OrganizationSubscription>(`/api/v1/admin/organizations/${organizationId}/subscription`, {
      method: 'PATCH',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  suspendSubscription(organizationId: string, reason: string, idempotencyKey: string) {
    return request<void>(`/api/v1/admin/organizations/${organizationId}/subscription/suspend`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  },

  reinstateSubscription(organizationId: string, reason: string, idempotencyKey: string) {
    return request<void>(`/api/v1/admin/organizations/${organizationId}/subscription/reinstate`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  },

  closeSubscription(organizationId: string, reason: string, idempotencyKey: string) {
    return request<void>(`/api/v1/admin/organizations/${organizationId}/subscription/close`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ reason }),
    });
  },

  // ── Credits, exposure and reconciliation ───────────────────────────────────

  adjustCredits(payload: CreditAdjustmentPayload, idempotencyKey: string) {
    return request<void>('/api/v1/admin/credits/adjustments', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    });
  },

  getExposure(params: { expiring_within_days?: number; status?: string; page?: number; page_size?: number } = {}) {
    return request<CreditExposureResponse>(`/api/v1/admin/subscriptions/exposure${buildQuery({ ...params })}`);
  },

  getReconciliation(params: { from?: string; to?: string } = {}) {
    return request<ReconciliationResponse>(`/api/v1/admin/subscriptions/reconciliation${buildQuery({ ...params })}`);
  },

  getCreditBalance(organizationId: string) {
    return request<QRCreditBalance>(`/api/v1/qr-credits/organizations/${organizationId}`);
  },

  getCreditLedger(organizationId: string, page = 1, pageSize = 20) {
    return request<QRCreditLedgerResponse>(
      `/api/v1/qr-credits/organizations/${organizationId}/ledger${buildQuery({ page, page_size: pageSize })}`,
    );
  },

  getCreditBatches(organizationId: string, page = 1, pageSize = 50) {
    return request<CreditBatchListResponse>(
      `/api/v1/admin/organizations/${organizationId}/credits/batches${buildQuery({ page, page_size: pageSize })}`,
    );
  },
};
