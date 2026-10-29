/**
 * Dummy activation payment.
 *
 * TEMPORARY: the deployed Core API has no customer-facing activation endpoint,
 * so this module fakes a provider settlement and records it locally so the
 * dashboard can be exercised end to end. Replace `processActivationPayment`
 * with a real quote → checkout → verified-webhook flow once Core exposes
 * `POST /api/v1/account/subscription/activate`.
 *
 * No card data is collected and nothing is charged.
 */

import type { AccountCredits, CreditBatch, CreditLedgerEntry } from '../types';

const STORAGE_PREFIX = 'ciphercode:dummy-activation:';
const SIMULATED_LATENCY_MS = 1200;

export interface DummyActivationRecord {
  organizationId: string;
  reference: string;
  amount: string;
  currency: string;
  method: string;
  paid_at: string;
  granted_credits: string;
  expires_at: string;
  batch_id: string;
}

export interface DummyActivationInput {
  organizationId: string;
  amount: string;
  currency: string;
  method: string;
  /** Simulated credit grant, so the dashboard has a balance to display. */
  credits: string;
}

export interface DummyCreditGrant {
  batch: CreditBatch;
  entry: CreditLedgerEntry;
}

function storageKey(organizationId: string): string {
  return `${STORAGE_PREFIX}${organizationId}`;
}

export function getDummyActivation(organizationId: string): DummyActivationRecord | null {
  try {
    const raw = window.localStorage.getItem(storageKey(organizationId));
    return raw ? (JSON.parse(raw) as DummyActivationRecord) : null;
  } catch {
    return null;
  }
}

export function clearDummyActivation(organizationId: string): void {
  try {
    window.localStorage.removeItem(storageKey(organizationId));
  } catch {
    // Storage unavailable (private mode) — nothing to clear.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const DummyPaymentService = {
  async processActivationPayment(input: DummyActivationInput): Promise<DummyActivationRecord> {
    if (!input.organizationId) throw new Error('Organization is required.');
    await delay(SIMULATED_LATENCY_MS);
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + 12);
    const record: DummyActivationRecord = {
      organizationId: input.organizationId,
      reference: `DUMMY-${Date.now().toString(36).toUpperCase()}`,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      paid_at: now.toISOString(),
      granted_credits: input.credits,
      expires_at: expires.toISOString(),
      batch_id: `dummy-batch-${Date.now().toString(36)}`,
    };
    try {
      window.localStorage.setItem(storageKey(input.organizationId), JSON.stringify(record));
    } catch {
      // Storage unavailable — the in-memory reload will still show the banner cleared.
    }
    return record;
  },
};

/** Synthesises the `/account/credits` payload for a test activation. */
export function buildDummyCredits(record: DummyActivationRecord, idWeight: string): AccountCredits {
  const weight = Number(idWeight);
  return {
    available: record.granted_credits,
    reserved: '0',
    used_this_period: '0',
    expiring_30_days: '0',
    expiring_60_days: '0',
    expiring_90_days: '0',
    earliest_expiry: { batch_id: record.batch_id, expires_at: record.expires_at, quantity: record.granted_credits },
    id_weight: idWeight,
    estimated_ids_available: weight > 0 ? Math.floor(Number(record.granted_credits) / weight) : 0,
    as_of: new Date().toISOString(),
  };
}

/** Synthesises the batch + ledger row shown in the Credits tab for a test activation. */
export function buildDummyGrant(record: DummyActivationRecord): DummyCreditGrant {
  return {
    batch: {
      id: record.batch_id,
      source_type: 'promo',
      source_ref: record.reference,
      granted: record.granted_credits,
      remaining: record.granted_credits,
      issued_at: record.paid_at,
      expires_at: record.expires_at,
      status: 'active',
    },
    entry: {
      id: `${record.batch_id}-grant`,
      batch_id: record.batch_id,
      type: 'grant',
      qty: record.granted_credits,
      balance_after: record.granted_credits,
      operation_id: null,
      reference_type: 'dummy_activation',
      reference_id: record.reference,
      reason: 'Test grant from dummy activation',
      occurred_at: record.paid_at,
    },
  };
}
