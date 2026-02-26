import type { PaymentStatus, PaymentMode } from '../types/payment.types';

/**
 * Format currency amount with currency code.
 * Accepts number or string (API may return decimal as string).
 */
export function formatCurrency(amount: number | string, currencyCode: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return `${currencyCode} 0.00`;
  return `${currencyCode} ${n.toFixed(2)}`;
}

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * Normalize API date (ISO or other) to YYYY-MM-DD for <input type="date">.
 * Returns empty string if value is missing or invalid.
 */
export function toDateInputValue(value: string | undefined): string {
  if (value == null || value === '') return '';
  const s = typeof value === 'string' ? value.trim() : '';
  const dateOnly = s.split('T')[0];
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get status badge color classes
 */
export function getStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    Draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    Confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colors[status];
}

/**
 * Get payment mode display label
 */
export function getPaymentModeLabel(mode: PaymentMode): string {
  const labels: Record<PaymentMode, string> = {
    Cash: 'Cash',
    Check: 'Check',
    Bank_Transfer: 'Bank Transfer',
  };
  return labels[mode];
}

/**
 * Get stat card icon background color
 */
export function getStatIconColors(type: 'total' | 'draft' | 'confirmed' | 'cancelled') {
  const colors = {
    total: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      icon: 'text-slate-600 dark:text-slate-400',
    },
    draft: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    confirmed: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
    },
    cancelled: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
    },
  };
  return colors[type];
}
