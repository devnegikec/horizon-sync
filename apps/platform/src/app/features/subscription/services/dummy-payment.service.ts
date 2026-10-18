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

const STORAGE_PREFIX = 'ciphercode:dummy-activation:';
const SIMULATED_LATENCY_MS = 1200;

export interface DummyActivationRecord {
  organizationId: string;
  reference: string;
  amount: string;
  currency: string;
  method: string;
  paid_at: string;
}

export interface DummyActivationInput {
  organizationId: string;
  amount: string;
  currency: string;
  method: string;
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
    const record: DummyActivationRecord = {
      organizationId: input.organizationId,
      reference: `DUMMY-${Date.now().toString(36).toUpperCase()}`,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      paid_at: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(storageKey(input.organizationId), JSON.stringify(record));
    } catch {
      // Storage unavailable — the in-memory reload will still show the banner cleared.
    }
    return record;
  },
};
