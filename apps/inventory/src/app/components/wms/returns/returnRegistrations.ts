import {
  RETURN_REGISTRATION_REASON_CATEGORIES,
  type CreateReturnRegistrationLine,
  type InboundExceptionReason,
  type ReturnReference,
  type ReturnReferenceLine,
  type ReturnRegistrationStatus,
} from '../../../types/wms.types';

/**
 * A registration may only be cancelled before the dock scans the first unit: once
 * a session has opened the server refuses with `RETURN_REGISTRATION_NOT_CANCELLABLE`.
 */
export function canCancelRegistration(status: ReturnRegistrationStatus): boolean {
  return status === 'draft' || status === 'ready';
}

/** Lines with nothing left to return are hidden from the form (§4.1). */
export function returnableLines(reference: ReturnReference | null): ReturnReferenceLine[] {
  return (reference?.lines ?? []).filter((line) => line.returnable_qty > 0);
}

/** One editable row of the registration form. */
export interface RegistrationLineDraft {
  lineId: string;
  included: boolean;
  quantity: string;
  /** Free text: comma, space or newline separated. */
  serials: string;
}

/** Nothing is selected up front — a partial return is the common case. */
export function initialLineDrafts(reference: ReturnReference | null): RegistrationLineDraft[] {
  return returnableLines(reference).map((line) => ({
    lineId: line.line_id,
    included: false,
    quantity: '1',
    serials: '',
  }));
}

/** A positive number, or `null` when the text is unusable or not a quantity. */
export function parseQuantity(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** Comma, space or newline separated serials, trimmed and de-duplicated. */
export function parseSerials(value: string): string[] {
  const parts = value
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

/** `null` when the draft is valid, otherwise the message shown under the input. */
export function lineDraftError(line: ReturnReferenceLine, draft: RegistrationLineDraft): string | null {
  const quantity = parseQuantity(draft.quantity);
  if (quantity === null) return 'Enter a quantity greater than zero';
  if (quantity > line.returnable_qty) return `Only ${line.returnable_qty} can be returned`;
  return null;
}

function lineById(lines: ReturnReferenceLine[], lineId: string): ReturnReferenceLine | null {
  return lines.find((line) => line.line_id === lineId) ?? null;
}

export interface RegistrationDraftState {
  reference: ReturnReference | null;
  drafts: RegistrationLineDraft[];
  reasonCode: string;
}

/** The selected lines that pass validation — exactly what may be submitted. */
export function validDrafts({ reference, drafts }: RegistrationDraftState): { line: ReturnReferenceLine; draft: RegistrationLineDraft }[] {
  const lines = returnableLines(reference);
  const valid: { line: ReturnReferenceLine; draft: RegistrationLineDraft }[] = [];

  for (const draft of drafts) {
    if (!draft.included) continue;
    const line = lineById(lines, draft.lineId);
    if (line && lineDraftError(line, draft) === null) valid.push({ line, draft });
  }

  return valid;
}

/** A registration needs a reason and at least one valid line. */
export function canSubmitRegistration(state: RegistrationDraftState): boolean {
  return Boolean(state.reasonCode) && validDrafts(state).length > 0;
}

export function buildRegistrationLines(state: RegistrationDraftState): CreateReturnRegistrationLine[] {
  return validDrafts(state).map(({ line, draft }) => {
    const request: CreateReturnRegistrationLine = {
      sku: line.sku,
      quantity: parseQuantity(draft.quantity) ?? 0,
      uom: line.uom,
    };
    const serials = parseSerials(draft.serials);
    if (serials.length > 0) request.serials = serials;
    return request;
  });
}

/** Total units across the selected lines, shown on the submit bar. */
export function registrationTotalQty(state: RegistrationDraftState): number {
  return validDrafts(state).reduce((sum, { draft }) => sum + (parseQuantity(draft.quantity) ?? 0), 0);
}

/** Reason codes a registration may be raised under (§7). */
export function registrationReasonOptions(reasons: InboundExceptionReason[]): InboundExceptionReason[] {
  return reasons.filter((reason) => RETURN_REGISTRATION_REASON_CATEGORIES.includes(reason.category));
}
