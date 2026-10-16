import type { ReceivingSlip, ReceivingSlipGroupItem } from '../../../types/wms.types';

/** What a supervisor is about to accept, derived from the slip's lines. */
export interface SlipDiscrepancies {
  /** Lines carrying any discrepancy flag. */
  flagged: number;
  shortLines: number;
  /** Total units missing against the ASN across the short lines. */
  shortUnits: number;
  /** Damaged, excess, hold or quarantine — everything that needs segregating. */
  segregatedLines: number;
}

const NO_DISCREPANCIES: SlipDiscrepancies = { flagged: 0, shortLines: 0, shortUnits: 0, segregatedLines: 0 };

/**
 * `ok` is the default and `rejected` is terminal, so neither counts as a
 * discrepancy. Anything else — including flags this build does not know — does.
 */
function isDiscrepancy(flag: string): boolean {
  return flag !== 'ok' && flag !== 'rejected';
}

function groupedLines(slip: ReceivingSlip): ReceivingSlipGroupItem[] {
  const lines: ReceivingSlipGroupItem[] = [];
  (slip.groups ?? []).forEach((group) => {
    if (Array.isArray(group.items)) lines.push(...group.items);
  });
  return lines;
}

/**
 * Flag + shortage detail for every line, across both response shapes. The legacy
 * flat payload predates shortage tracking, so it has no `short_qty`.
 */
function discrepancyLines(slip: ReceivingSlip): { flag: string; shortQty: number | null }[] {
  const grouped = groupedLines(slip);
  if (grouped.length > 0) {
    return grouped
      .filter((item) => isDiscrepancy(item.flag))
      .map((item) => ({ flag: item.flag, shortQty: item.short_qty ?? null }));
  }
  return (slip.items ?? [])
    .filter((item) => isDiscrepancy(item.flag))
    .map((item) => ({ flag: item.flag, shortQty: null }));
}

/**
 * Summarises the discrepancies on a slip so approving is an informed decision —
 * short lines can only be flagged while the slip is `pending_review`, so this is
 * the last point at which the picture can be corrected.
 */
export function slipDiscrepancies(slip: ReceivingSlip | null): SlipDiscrepancies {
  if (!slip) return NO_DISCREPANCIES;

  const lines = discrepancyLines(slip);
  const shortLines = lines.filter((line) => line.flag === 'short');

  return {
    flagged: lines.length,
    shortLines: shortLines.length,
    shortUnits: shortLines.reduce((total, line) => total + (line.shortQty ?? 0), 0),
    segregatedLines: lines.length - shortLines.length,
  };
}

/** Human phrases for the summary, e.g. `2 line(s) short — 5 unit(s) missing`. */
export function discrepancyPhrases(found: SlipDiscrepancies): string[] {
  const phrases: string[] = [];
  if (found.shortLines > 0) phrases.push(`${found.shortLines} line(s) short — ${found.shortUnits} unit(s) missing`);
  if (found.segregatedLines > 0) phrases.push(`${found.segregatedLines} line(s) damaged, excess, on hold or quarantined`);
  return phrases;
}
