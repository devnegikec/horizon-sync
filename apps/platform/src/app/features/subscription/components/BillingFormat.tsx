import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';

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

/** Truncates (never rounds) the raw API string for display. */
export function formatDecimal(value: string | number | null | undefined, maxFractionDigits = 2): string {
  const parts = parseDecimal(value);
  if (!parts) return '—';
  const fraction = parts.fraction.slice(0, maxFractionDigits).replace(/0+$/, '');
  return `${parts.sign}${groupDigits(parts.digits)}${fraction ? `.${fraction}` : ''}`;
}

function currencySymbol(currency: string): string {
  const upper = (currency || 'USD').toUpperCase();
  const known: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NGN: '₦', AED: 'AED ' };
  if (known[upper]) return known[upper];
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: upper }).formatToParts(1);
    return parts.find((part) => part.type === 'currency')?.value ?? `${upper} `;
  } catch {
    return `${upper} `;
  }
}

function formatMoney(value: string | number | null | undefined): string {
  const parts = parseDecimal(value);
  if (!parts) return '—';
  return `${parts.sign}${groupDigits(parts.digits)}.${parts.fraction.slice(0, 2).padEnd(2, '0')}`;
}

export function Money({ value, currency, className }: { value: string | number | null | undefined; currency: string; className?: string }) {
  if (value === null || value === undefined) return <span className={className}>—</span>;
  return (
    <span className={className} title={`${value} ${currency}`}>
      {currencySymbol(currency)}
      {formatMoney(value)}
    </span>
  );
}

/** 2dp display with the exact 6dp value in the tooltip. */
export function CreditQuantity({ value, className }: { value: string | number | null | undefined; className?: string }) {
  return (
    <span className={className} title={value === null || value === undefined ? undefined : String(value)}>
      {formatDecimal(value, 2)}
    </span>
  );
}

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

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  active: 'success',
  pending_activation_payment: 'warning',
  overdue: 'destructive',
  suspended: 'destructive',
  closed: 'secondary',
  draft: 'secondary',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending_activation_payment: 'Activation pending',
  overdue: 'Overdue',
  suspended: 'Suspended',
  closed: 'Closed',
  draft: 'Draft',
  paid: 'Paid',
  issued: 'Issued',
  partially_paid: 'Partially paid',
  void: 'Void',
};

export function StatusPill({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'outline'}>{STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}</Badge>;
}
