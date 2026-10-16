import * as React from 'react';

import { TriangleAlert } from 'lucide-react';

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
} from '@horizon-sync/ui/components';

import type { CloseOutcome, InboundExceptionReason, ShortBalance } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { inboundApi } from '../../../utility/api/wms';

import { FieldError, fieldIssue } from './shortageShared';

/** Radix rejects an empty string as an item value, so "no reason" needs a sentinel. */
const NO_REASON = '__no_reason__';

/**
 * `resolved_by_receipt` is only legal on the server once nothing is outstanding,
 * so the default has to follow the balance rather than a fixed order.
 */
function defaultOutcome(balance: ShortBalance | null): CloseOutcome {
  return balance && balance.short_qty > 0 ? 'written_off' : 'resolved_by_receipt';
}

function writeOffDescription(shortQty: number): string {
  return shortQty > 0
    ? 'The stock is not expected to arrive. The loss is accepted and recorded against the ASN.'
    : 'Unavailable — the short quantity is already zero, so there is nothing left to write off.';
}

function receiptDescription(shortQty: number): string {
  return shortQty > 0
    ? `Unavailable — ${shortQty} unit(s) are still missing. Wait for the next receipt, or write the balance off.`
    : 'The missing units arrived on a later receipt. Use this to close the balance as resolved.';
}

function OutcomeOption({
  id,
  checked,
  disabled,
  label,
  description,
  onSelect,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <input id={id} type="radio" className="mt-0.5" checked={checked} disabled={disabled} onChange={onSelect} />
      <label htmlFor={id} className={disabled ? '' : 'cursor-pointer'}>
        <span className="text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </label>
    </div>
  );
}

function CloseErrorNotice({ error }: { error: NormalizedApiError }) {
  const approvalRequired = error.code === 'SHORTAGE_APPROVAL_REQUIRED';
  const alreadyClosed = error.code === 'SHORTAGE_ALREADY_CLOSED';
  const required = error.requiredState?.length ? error.requiredState.join(', ') : null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        <p>
          {approvalRequired
            ? 'Manager approval required — this shortage can only be closed by a warehouse manager.'
            : error.message}
        </p>
        {error.hint && <p className="text-muted-foreground">{error.hint}</p>}
        {error.currentState && (
          <p className="text-muted-foreground">
            Current state: {error.currentState}
            {required ? ` · required: ${required}` : ''}
          </p>
        )}
        {alreadyClosed && (
          <p className="text-muted-foreground">Refresh the ledger to see who closed it and when.</p>
        )}
      </div>
    </div>
  );
}

interface CloseErrorHandlers {
  /** The balance is gone; refresh the caller's row. */
  onStale?: () => void;
  close: () => void;
  reloadReasons: () => void;
  clearReason: () => void;
}

/**
 * Two failures need more than a message: a stale reason list (refetch and force
 * a new choice) and a vanished balance (refresh and close). Everything else is
 * left on screen for the operator to read and correct.
 */
function routeCloseError(error: NormalizedApiError, handlers: CloseErrorHandlers): void {
  if (error.code === 'SHORTAGE_REASON_INVALID') {
    handlers.reloadReasons();
    handlers.clearReason();
    return;
  }
  if (error.httpStatus === 404) {
    handlers.onStale?.();
    handlers.close();
  }
}

export interface CloseShortageDialogProps {
  /** Open balance being closed. `null` closes the dialog. */
  balance: ShortBalance | null;
  onOpenChange: (open: boolean) => void;
  /** Receives the server's updated balance so the ledger can refresh in place. */
  onClosed: (balance: ShortBalance, outcome: CloseOutcome) => void;
  /** The balance no longer exists (`404`), so the caller must refetch the row. */
  onStale?: () => void;
}

/**
 * Write-off / formal closure of a residual short. Closing is terminal and can
 * only be undone by approving a new receipt, so the request is never applied
 * optimistically — the row is updated from the response alone.
 */
export function CloseShortageDialog({ balance, onOpenChange, onClosed, onStale }: CloseShortageDialogProps) {
  const token = useUserStore((state) => state.accessToken);

  const [outcome, setOutcome] = React.useState<CloseOutcome>('written_off');
  const [reasonCode, setReasonCode] = React.useState('');
  const [note, setNote] = React.useState('');
  const [reasons, setReasons] = React.useState<InboundExceptionReason[]>([]);
  const [reasonsReloadKey, setReasonsReloadKey] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  const shortQty = balance?.short_qty ?? 0;
  const isWrittenOff = outcome === 'written_off';
  const canResolveByReceipt = shortQty <= 0;
  const needsReason = isWrittenOff;

  // Re-seed for every balance so a second write-off never inherits the first form.
  React.useEffect(() => {
    setOutcome(defaultOutcome(balance));
    setReasonCode('');
    setNote('');
    setError(null);
  }, [balance]);

  React.useEffect(() => {
    if (!token || !balance) return undefined;
    let cancelled = false;
    inboundApi
      .listExceptionReasons(token)
      .then((all) => {
        if (!cancelled) setReasons(all.filter((reason) => reason.category === 'short'));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toNormalizedApiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, balance, reasonsReloadKey]);

  const reloadReasons = () => setReasonsReloadKey((key) => key + 1);

  const submit = async () => {
    if (!token || !balance) return;
    if (needsReason && !reasonCode) {
      setError({
        httpStatus: 400,
        code: 'SHORTAGE_REASON_REQUIRED',
        message: 'Select a closure reason before writing this shortage off.',
        fields: [{ field: 'reason_code', hint: 'Every write-off needs an auditable reason.' }],
      });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await inboundApi.closeShortBalance(token, balance.id, {
        outcome,
        reason_code: reasonCode || null,
        note: note.trim() || null,
      });
      onClosed(updated, outcome);
    } catch (err) {
      const normalized = toNormalizedApiError(err);
      setError(normalized);
      routeCloseError(normalized, {
        onStale,
        close: () => onOpenChange(false),
        reloadReasons,
        clearReason: () => setReasonCode(''),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!balance} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close shortage</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-medium text-foreground">{balance?.sku}</span> · {shortQty} unit(s) short against its ASN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Closing is final — the balance stops appearing in the shortage worklist. Only a warehouse manager can do this.
          </p>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Outcome</legend>
            <OutcomeOption id="outcome-write-off"
              checked={isWrittenOff}
              disabled={shortQty <= 0}
              label="Write off"
              description={writeOffDescription(shortQty)}
              onSelect={() => setOutcome('written_off')}/>
            <OutcomeOption id="outcome-later-receipt"
              checked={!isWrittenOff}
              disabled={!canResolveByReceipt}
              label="Resolved by a later receipt"
              description={receiptDescription(shortQty)}
              onSelect={() => setOutcome('resolved_by_receipt')}/>
          </fieldset>

          <div className="space-y-1">
            <Label htmlFor="close-shortage-reason">Closure reason{needsReason ? '' : ' (optional)'}</Label>
            <Select value={reasonCode || NO_REASON} onValueChange={(value) => setReasonCode(value === NO_REASON ? '' : value)}>
              <SelectTrigger id="close-shortage-reason">
                <SelectValue placeholder="Select a closure reason"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_REASON}>No reason</SelectItem>
                {reasons.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.name} — {reason.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError issue={fieldIssue(error, 'reason_code')}/>
          </div>

          <div className="space-y-1">
            <Label htmlFor="close-shortage-approver">Approved by / claim reference</Label>
            <Input id="close-shortage-approver"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Claim raised with supplier CC-991"/>
            <p className="text-xs text-muted-foreground">Stored on the balance and shown in its history.</p>
            <FieldError issue={fieldIssue(error, 'note')}/>
          </div>

          {error && <CloseErrorNotice error={error}/>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant={isWrittenOff ? 'destructive' : 'default'} onClick={submit} disabled={submitting}>
            {submitting ? 'Closing…' : isWrittenOff ? 'Write off shortage' : 'Close as resolved'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
