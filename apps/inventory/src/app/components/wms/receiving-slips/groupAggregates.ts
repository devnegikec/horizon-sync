import type { ReceivingSlipGroup } from '../../../types/wms.types';

/**
 * Aggregate a group-level flag from its child items.
 * All rejected → `rejected`; some rejected → `mixed`; otherwise the first item's flag.
 */
export function getGroupFlag(group: ReceivingSlipGroup): string {
  const items = Array.isArray(group.items) ? group.items : [];
  const flags = items.map((item) => item.flag ?? 'ok');
  const allRejected = flags.length > 0 && flags.every((flag) => flag === 'rejected');
  if (allRejected) return 'rejected';
  const anyRejected = flags.some((flag) => flag === 'rejected');
  return anyRejected ? 'mixed' : (items[0]?.flag ?? 'ok');
}

/**
 * Aggregate a group-level condition code from its child items.
 * A single distinct code is returned as-is; multiple codes become `MIXED`.
 */
export function getGroupCondition(group: ReceivingSlipGroup): string | null {
  const codes = (Array.isArray(group.items) ? group.items : [])
    .map((item) => item.condition_code?.trim().toUpperCase() ?? null)
    .filter((code): code is string => Boolean(code));
  if (codes.length === 0) return null;
  const unique = [...new Set(codes)];
  return unique.length === 1 ? unique[0] : 'MIXED';
}
