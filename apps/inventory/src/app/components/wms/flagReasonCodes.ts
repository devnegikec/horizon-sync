import type { InboundExceptionReason, SettableLineFlag } from '../../types/wms.types';
import { FLAG_REASON_CATEGORIES } from '../../types/wms.types';

/**
 * Reason codes are categorised, and the API rejects a code whose category does
 * not match the flag. Every picker filters through here before it renders, so an
 * illegal pair can never be submitted.
 *
 * Put-away classifications are a subset of the settable flags, so they use these
 * helpers unchanged.
 */
export function reasonsForFlag(reasons: InboundExceptionReason[], flag: SettableLineFlag): InboundExceptionReason[] {
  const categories = FLAG_REASON_CATEGORIES[flag];
  return reasons.filter((reason) => categories.includes(reason.category));
}

/**
 * Keeps a selection valid for the current flag: the existing code while it still
 * matches the category, otherwise the first code in the category.
 */
export function nextReasonCode(reasons: InboundExceptionReason[], flag: SettableLineFlag, current: string): string {
  const options = reasonsForFlag(reasons, flag);
  if (options.some((option) => option.code === current)) return current;
  return options[0]?.code ?? '';
}

/**
 * The bin a reason suggests. Prefilling it saves the common case without hiding
 * the choice — the operator can still override it.
 */
export function destinationForCode(reasons: InboundExceptionReason[], code: string): 'HOLD' | 'QUARANTINE' | null {
  return reasons.find((reason) => reason.code === code)?.default_destination ?? null;
}
