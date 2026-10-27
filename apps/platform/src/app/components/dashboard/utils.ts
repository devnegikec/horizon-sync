/** Coerce a backend value (number or serialized string) to a number. */
export function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/** Compact integer formatting (`—` when not numeric). */
export function formatInt(value: unknown): string {
  const n = toNumber(value);
  return n == null ? '—' : Math.round(n).toLocaleString();
}

/** Indian-rupee compact formatting, matching the other dashboard widgets. */
export function formatCurrency(value: unknown): string {
  const n = toNumber(value);
  if (n == null) return '—';
  if (Math.abs(n) >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

/** Percentage formatting with a trailing `%` (`—` when not numeric). */
export function formatPct(value: unknown, digits = 1): string {
  const n = toNumber(value);
  return n == null ? '—' : `${n.toFixed(digits)}%`;
}

/** Short relative time for the activity feed. */
export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
