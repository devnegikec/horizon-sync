import * as React from 'react';

import { AlertTriangle, Info, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@horizon-sync/ui/components';

import { useExceptionReasons } from '../../../hooks/useExceptionReasons';
import type { FlagLineResponse, ReceivingSlipGroupItem, SettableLineFlag } from '../../../types/wms.types';
import { SETTABLE_LINE_FLAGS, flagNeedsDestination } from '../../../types/wms.types';
import type { NormalizedApiError } from '../../../utility/api/core';
import { toNormalizedApiError } from '../../../utility/api/core';
import { inboundApi } from '../../../utility/api/wms';
import { FieldError, fieldIssue } from '../apiErrorFields';
import { nextReasonCode, reasonsForFlag } from '../flagReasonCodes';

/** What each flag does, shown under the picker so the operator knows the effect. */
const FLAG_HINTS: Record<SettableLineFlag, string> = {
  short: 'Units missing against the ASN. Recorded on the ledger only — nothing is segregated.',
  damaged: 'Visible damage. Creates an exception and moves the stock to HOLD or QUARANTINE.',
  excess: 'More or unexpected stock than the ASN. Creates an exception.',
  hold: 'Operational hold. Creates an exception.',
  quarantine: 'Quality or compliance quarantine. Creates an exception.',
};

const FLAG_LABELS: Record<SettableLineFlag, string> = {
  short: 'Short',
  damaged: 'Damaged',
  excess: 'Excess',
  hold: 'Hold',
  quarantine: 'Quarantine',
};

function isSettableFlag(flag: string | null | undefined): flag is SettableLineFlag {
  return SETTABLE_LINE_FLAGS.some((candidate) => candidate === flag);
}

interface FlagPayloadInput {
  flag: SettableLineFlag;
  reasonCode: string;
  shortQty: string;
  destination: string;
  notes: string;
}

/**
 * Builds the request so the API's two cross-field rules can never be violated:
 * `short_qty` is only sent for `short`, `destination` only for segregation flags.
 */
function buildFlagPayload({ flag, reasonCode, shortQty, destination, notes }: FlagPayloadInput) {
  const payload: { flag: SettableLineFlag; reason_code: string; short_qty?: number; destination?: 'HOLD' | 'QUARANTINE' | null; notes?: string } = {
    flag,
    reason_code: reasonCode,
  };
  if (flag === 'short') {
    payload.short_qty = Number(shortQty) || 0;
  } else {
    payload.destination = (destination || null) as 'HOLD' | 'QUARANTINE' | null;
  }
  const trimmed = notes.trim();
  if (trimmed) payload.notes = trimmed;
  return payload;
}

/** Whole-request failure: the server's sentence, its `hint`, and the state clash. */
function ErrorNotice({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
  const retryable = error.httpStatus === 0 || error.httpStatus >= 500;
  const required = error.requiredState?.length ? error.requiredState.join(', ') : null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="text-sm text-destructive">{error.message}</p>
        {error.hint && <p className="text-xs text-muted-foreground">{error.hint}</p>}
        {error.currentState && (
          <p className="text-xs text-muted-foreground">
            Current state: <span className="font-medium">{error.currentState}</span>
            {required ? ` · Required: ${required}` : ''}
          </p>
        )}
        {retryable && (
          <Button type="button" variant="outline" size="sm" className="mt-1 h-7 gap-1 px-2 text-xs" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The two flag-specific inputs. `short` needs the missing quantity; every other
 * flag needs somewhere to segregate the stock to. Sending either one for the
 * wrong flag is a 400, so they are mutually exclusive here.
 */
function FlagQuantityFields({
  flag,
  shortQty,
  destination,
  error,
  onShortQtyChange,
  onDestinationChange,
}: {
  flag: SettableLineFlag;
  shortQty: string;
  destination: string;
  error: NormalizedApiError | null;
  onShortQtyChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
}) {
  if (flag === 'short') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="flag-line-short-qty">Short quantity *</Label>
        <Input id="flag-line-short-qty"
          type="number"
          min={1}
          value={shortQty}
          onChange={(event) => onShortQtyChange(event.target.value)}
          placeholder="Units missing against the ASN"/>
        <FieldError issue={fieldIssue(error, 'short_qty')} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="flag-line-destination">Physical destination *</Label>
      <Select value={destination} onValueChange={onDestinationChange}>
        <SelectTrigger id="flag-line-destination">
          <SelectValue placeholder="Select a destination" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HOLD">HOLD</SelectItem>
          <SelectItem value="QUARANTINE">QUARANTINE</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Segregated stock needs somewhere to go.</p>
      <FieldError issue={fieldIssue(error, 'destination')} />
    </div>
  );
}

/** Both failure sources, so the dialog body stays a plain layout. */
function DialogErrorNotices({
  reasonsError,
  submitError,
  onRetryReasons,
  onRetrySubmit,
}: {
  reasonsError: NormalizedApiError | null;
  submitError: NormalizedApiError | null;
  onRetryReasons: () => void;
  onRetrySubmit: () => void;
}) {
  return (
    <>
      {reasonsError && <ErrorNotice error={reasonsError} onRetry={onRetryReasons} />}
      {submitError && <ErrorNotice error={submitError} onRetry={onRetrySubmit} />}
    </>
  );
}

/** Mirrors the API's cross-field rules so the Save button cannot 400 on shape. */
function canSubmitFlag(flag: SettableLineFlag, reasonCode: string, shortQty: number, destination: string): boolean {
  if (!reasonCode) return false;
  if (!flagNeedsDestination(flag)) return shortQty > 0;
  return Boolean(destination);
}

export interface FlagLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slipId: string;
  /** Line being flagged. `null` closes the dialog. */
  item: ReceivingSlipGroupItem | null;
  /** Receives the server's normalised line so the caller can report the result. */
  onFlagged: (result: FlagLineResponse) => void;
  /**
   * The slip or its line no longer exists (`404`). The caller refetches so the
   * stale row disappears instead of being retried forever.
   */
  onStale?: () => void;
}

export function FlagLineDialog({ open, onOpenChange, slipId, item, onFlagged, onStale }: FlagLineDialogProps) {
  const token = useUserStore((state) => state.accessToken);
  const { reasons, loading: reasonsLoading, error: reasonsError, reload: reloadReasons } = useExceptionReasons(open);

  const [flag, setFlag] = React.useState<SettableLineFlag>('short');
  const [reasonCode, setReasonCode] = React.useState('');
  const [shortQty, setShortQty] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  // Re-flagging is allowed while the slip is pending review, so start from the
  // line's current values and let the operator correct them.
  React.useEffect(() => {
    if (!open) return;
    setFlag(isSettableFlag(item?.flag) ? item.flag : 'short');
    setReasonCode(item?.reason_code ?? '');
    setShortQty(item?.short_qty ? String(item.short_qty) : '');
    setDestination('');
    setNotes('');
    setError(null);
  }, [open, item]);

  // Keep the reason code inside the selected flag's category.
  React.useEffect(() => {
    setReasonCode((current) => nextReasonCode(reasons, flag, current));
  }, [reasons, flag]);

  const shortQtyValue = Number(shortQty) || 0;
  const canSubmit = canSubmitFlag(flag, reasonCode, shortQtyValue, destination);

  const submit = React.useCallback(async () => {
    if (!token || !item) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await inboundApi.flagLineItem(token, slipId, item.id, buildFlagPayload({ flag, reasonCode, shortQty, destination, notes }));
      onFlagged(result);
      onOpenChange(false);
    } catch (err) {
      const normalized = toNormalizedApiError(err);
      setError(normalized);
      if (normalized.code === 'REASON_CODE_INVALID') {
        // The picker was built from a stale reference list: refetch it and force
        // a fresh choice rather than letting the operator resubmit the same code.
        reloadReasons();
        setReasonCode('');
        return;
      }
      if (normalized.httpStatus === 404) {
        // The slip or line moved on underneath us — refresh and drop the row.
        onStale?.();
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, item, slipId, flag, reasonCode, shortQty, destination, notes, onFlagged, onStale, reloadReasons, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Flag receiving line</DialogTitle>
          <DialogDescription>
            Records what actually arrived. The ASN expectation is never changed by this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="rounded-md bg-muted p-3 font-mono text-xs">
            {item?.sku} · {item?.serial_number}
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="flag-line-flag">Flag</Label>
            <Select value={flag} onValueChange={(value) => setFlag(value as SettableLineFlag)}>
              <SelectTrigger id="flag-line-flag">
                <SelectValue placeholder="Select a flag" />
              </SelectTrigger>
              <SelectContent>
                {SETTABLE_LINE_FLAGS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {FLAG_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {FLAG_HINTS[flag]}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flag-line-reason">Reason code</Label>
            <Select value={reasonCode} onValueChange={setReasonCode} disabled={reasonsLoading || !reasons.length}>
              <SelectTrigger id="flag-line-reason">
                <SelectValue placeholder={reasonsLoading ? 'Loading…' : 'Select a reason code'} />
              </SelectTrigger>
              <SelectContent>
                {reasonsForFlag(reasons, flag).map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.name} ({reason.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError issue={fieldIssue(error, 'reason_code')} />
          </div>

          <FlagQuantityFields flag={flag}
            shortQty={shortQty}
            destination={destination}
            error={error}
            onShortQtyChange={setShortQty}
            onDestinationChange={setDestination}/>

          <div className="space-y-1.5">
            <Label htmlFor="flag-line-notes">Note (optional)</Label>
            <Textarea id="flag-line-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. 2 cartons missing at dock"
              maxLength={2000}
              rows={2}/>
          </div>

          <DialogErrorNotices reasonsError={reasonsError}
            submitError={error}
            onRetryReasons={reloadReasons}
            onRetrySubmit={submit}/>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !canSubmit}>
            {submitting ? 'Saving…' : 'Save flag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


