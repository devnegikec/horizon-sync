import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';

import type {
  ActivationFeeStatus,
  BillingCadence,
  PlanVersionStatus,
  SubscriptionStatus,
} from '../../types/subscription.types';

// ─── Number / money formatting (string-safe, no float math) ───────────────────

interface DecimalParts {
  sign: string;
  digits: string;
  fraction: string;
}

function parseDecimal(value: string | number | null | undefined): DecimalParts | null {
  if (value === null || value === undefined) return null;
  const match = /^(-?)(\d*)(?:\.(\d+))?$/.exec(String(value).trim());
  if (!match) return null;
  return { sign: match[1], digits: match[2] || '0', fraction: match[3] ?? '' };
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Groups the integer part and trims trailing zeros. Input is the raw API string. */
export function formatDecimal(value: string | number | null | undefined, maxFractionDigits = 2): string {
  const parts = parseDecimal(value);
  if (!parts) return '—';
  const fraction = parts.fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  return `${parts.sign}${groupDigits(parts.digits)}${fraction ? `.${fraction}` : ''}`;
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NGN: '₦', AED: 'AED ' };

export function currencySymbol(currency: string): string {
  const upper = (currency || 'USD').toUpperCase();
  if (CURRENCY_SYMBOLS[upper]) return CURRENCY_SYMBOLS[upper];
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: upper }).formatToParts(1);
    return parts.find((part) => part.type === 'currency')?.value ?? `${upper} `;
  } catch {
    return `${upper} `;
  }
}

/** Money always shows 2 decimals; the value itself is never re-parsed as a float. */
export function formatMoney(value: string | number | null | undefined): string {
  const parts = parseDecimal(value);
  if (!parts) return '—';
  return `${parts.sign}${groupDigits(parts.digits)}.${parts.fraction.slice(0, 2).padEnd(2, '0')}`;
}

export function Money({ value, currency, className }: { value: string | number | null | undefined; currency: string; className?: string }) {
  if (value === null || value === undefined) return <span className={className}>—</span>;
  const symbol = currencySymbol(currency);
  return (
    <span className={className} title={`${value} ${currency}`}>
      {symbol}
      {formatMoney(value)}
    </span>
  );
}

/** Shows at most 2dp, keeps the full 6dp value in the tooltip. */
export function CreditQuantity({ value, className }: { value: string | number | null | undefined; className?: string }) {
  return (
    <span className={className} title={value === null || value === undefined ? undefined : String(value)}>
      {formatDecimal(value, 2)}
    </span>
  );
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** ISO string → value accepted by `<input type="datetime-local">`. */
export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `datetime-local` value → ISO-8601 UTC for the API. */
export function toIsoTimestamp(localValue: string): string | undefined {
  if (!localValue) return undefined;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Default effective date: tomorrow at 00:00 local time. */
export function defaultEffectiveFrom(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return toDateTimeLocal(date.toISOString());
}

// ─── Labels & badges ──────────────────────────────────────────────────────────

const CADENCE_LABELS: Record<BillingCadence, string> = { monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };

export function cadenceLabel(cadence: BillingCadence | null | undefined): string {
  return cadence ? CADENCE_LABELS[cadence] : '—';
}

const SUBSCRIPTION_STATUS: Record<SubscriptionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_activation_payment: { label: 'Pending activation payment', variant: 'warning' },
  active: { label: 'Active', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  suspended: { label: 'Suspended', variant: 'outline' },
  closed: { label: 'Closed', variant: 'secondary' },
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | null | undefined }) {
  if (!status) return <Badge variant="secondary">No subscription</Badge>;
  const config = SUBSCRIPTION_STATUS[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const VERSION_STATUS: Record<PlanVersionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', variant: 'warning' },
  approved: { label: 'Approved', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  retired: { label: 'Retired', variant: 'secondary' },
};

export function PlanVersionStatusBadge({ status }: { status: PlanVersionStatus }) {
  const config = VERSION_STATUS[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const ACTIVATION_FEE_LABELS: Record<ActivationFeeStatus, string> = {
  not_required: 'Not required',
  pending: 'Payment pending',
  paid: 'Paid',
};

export function activationFeeLabel(status: ActivationFeeStatus | null | undefined): string {
  return status ? (ACTIVATION_FEE_LABELS[status] ?? status) : '—';
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>): void {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Renders a value that may be missing. */
export function Dash({ children }: { children?: React.ReactNode }) {
  const empty = children === null || children === undefined || children === '';
  return <span className={empty ? 'text-muted-foreground' : undefined}>{empty ? '—' : children}</span>;
}

/** Explains why write actions are absent instead of silently hiding them. */
export function BillingReadOnlyNotice({ requiredPermission }: { requiredPermission: string }) {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      Read-only billing access. Creating or changing subscriptions requires <span className="font-mono">{requiredPermission}</span>.
    </div>
  );
}

// ─── Fixed-point helper (string math, no float arithmetic) ───────────────────

/**
 * Multiplies a decimal string by a positive integer using digit-by-digit
 * arithmetic, so the preview never suffers float rounding.
 */
export function multiplyDecimalByInteger(value: string, factor: number): string | null {
  const match = /^(-?)(\d*)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const [, sign, whole = '0', fraction = ''] = match;
  const digits = `${whole || '0'}${fraction}`;
  const scale = fraction.length;

  let carry = 0;
  const result: string[] = [];
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const product = Number(digits[index]) * factor + carry;
    result.unshift(String(product % 10));
    carry = Math.floor(product / 10);
  }
  while (carry > 0) {
    result.unshift(String(carry % 10));
    carry = Math.floor(carry / 10);
  }

  let digitsOut = result.join('').replace(/^0+(?=\d)/, '');
  if (scale > 0) {
    const padded = digitsOut.padStart(scale + 1, '0');
    digitsOut = `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
  }
  return `${sign}${digitsOut}`;
}

/** "100 IDs × weight" preview. */
export function sampleIdDebit(weight: string, idCount = 100): string | null {
  return multiplyDecimalByInteger(weight, idCount);
}

