import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@horizon-sync/ui/components';

import { useExceptionReasons } from '../../hooks/useExceptionReasons';
import type { AsnOrder, AsnOrderClosePayload } from '../../types/asn-order.types';
import type { AsnReceivingSummary, InboundExceptionReason } from '../../types/wms.types';
import { asnOrderApi } from '../../utility/api/asn-orders';
import { toNormalizedApiError, type NormalizedApiError } from '../../utility/api/core';

/** Radix rejects `''` as an item value, so "no reason" needs a sentinel. */
const NO_REASON = '__none__';

const NOTE_MAX_LENGTH = 1000;

const RECONCILIATION_VARIANTS: Record<AsnReceivingSummary['reconciliation_status'], 'success' | 'warning' | 'destructive' | 'outline'> = {
  pending: 'outline',
  partial: 'warning',
  exception: 'destructive',
  reconciled: 'success',
};

function fmtQty(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString();
}

/** Outstanding quantity, read from an optionally-loaded summary. */
function shortfallQty(summary: AsnReceivingSummary | null | undefined): number {
  return summary?.short_total_qty ?? 0;
}

function reconciliationStatusOf(summary: AsnReceivingSummary | null | undefined): AsnReceivingSummary['reconciliation_status'] | null {
  return summary?.reconciliation_status ?? null;
}

/**
 * Which recoveries a failed close needs. Kept out of the submit handler so the
 * dialog body stays flat: a retired reason list is recoverable in place, while a
 * gone / already-final ASN means the caller must refetch and drop the form.
 */
function closeErrorRecovery(error: NormalizedApiError): { reloadReasons: boolean; stale: boolean } {
  return {
    reloadReasons: error.code === 'SHORTAGE_REASON_INVALID',
    stale: error.httpStatus === 404 || error.code === 'ASN_ALREADY_CLOSED' || error.code === 'ASN_NOT_CLOSABLE',
  };
}

/** A fully delivered ASN closes with an empty payload; both fields are optional. */
function buildClosePayload(reasonCode: string, note: string): AsnOrderClosePayload {
  return { reason_code: reasonCode || null, note: note.trim() || null };
}

/** One number in the "what am I giving up" panel. */
function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'destructive' | 'success' }) {
  const toneClass = tone === 'destructive' ? 'text-destructive' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : '';
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

interface ReceivingPositionProps {
  summary: AsnReceivingSummary | null;
  loading: boolean;
  failed: boolean;
  isShortDelivery: boolean;
}

/** Expected vs accepted vs short, so the manager sees what is being written off. */
function ReceivingPosition({ summary, loading, failed, isShortDelivery }: ReceivingPositionProps) {
  const status = reconciliationStatusOf(summary);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Receiving position</Label>
        {status && <Badge variant={RECONCILIATION_VARIANTS[status]}>{status.replace(/_/g, ' ')}</Badge>}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading receiving summary…</p>
      ) : failed ? (
        <p className="text-sm text-destructive">
          Could not load the receiving summary. The ASN can still be closed, but the shortfall cannot be confirmed.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          <SummaryStat label="Expected" value={fmtQty(summary?.expected_total_qty)} />
          <SummaryStat label="Accepted" value={fmtQty(summary?.accepted_total_qty)} tone="success" />
          <SummaryStat label="Short (written off)"
            value={fmtQty(summary?.short_total_qty)}
            tone={isShortDelivery ? 'destructive' : undefined} />
        </div>
      )}
    </div>
  );
}

function ShortfallNotice({ shortQty }: { shortQty: number }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>
        {fmtQty(shortQty)} unit(s) will be recorded as an accepted shortfall, and every open shortage balance on this ASN is closed
        as written off with the same reason.
      </p>
    </div>
  );
}

function NoShortfallNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>Nothing is outstanding, so this closes as a plain delivery — no reason required.</p>
    </div>
  );
}

interface ReasonFieldProps {
  required: boolean;
  value: string;
  reasons: InboundExceptionReason[];
  loading: boolean;
  failed: boolean;
  onChange: (code: string) => void;
  onReload: () => void;
}

function ReasonField({ required, value, reasons, loading, failed, onChange, onReload }: ReasonFieldProps) {
  const showEmptyNotice = !loading && !failed && reasons.length === 0 && required;

  return (
    <div className="space-y-1">
      <Label htmlFor="close-asn-reason">
        Reason {required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(optional)</span>}
      </Label>
      <Select value={value || NO_REASON} onValueChange={(next) => onChange(next === NO_REASON ? '' : next)}>
        <SelectTrigger id="close-asn-reason">
          <SelectValue placeholder={loading ? 'Loading reasons…' : 'Select a reason'} />
        </SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={NO_REASON}>No reason needed</SelectItem>}
          {reasons.map((reason) => (
            <SelectItem key={reason.code} value={reason.code}>
              {reason.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {failed && (
        <p className="text-xs text-destructive">
          Could not load reason codes.{' '}
          <button type="button" className="underline" onClick={onReload}>
            Retry
          </button>
        </p>
      )}
      {showEmptyNotice && (
        <p className="text-xs text-muted-foreground">
          No <code>short</code> reason codes are configured — add one under inbound exception reasons to close this ASN.
        </p>
      )}
    </div>
  );
}

function NoteField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor="close-asn-note">Note (optional)</Label>
      <Textarea id="close-asn-note"
        value={value}
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        placeholder="e.g. Carrier short-shipped the last carton"
        onChange={(event) => onChange(event.target.value)} />
      <p className="text-right text-xs text-muted-foreground">
        {value.length}/{NOTE_MAX_LENGTH}
      </p>
    </div>
  );
}

/**
 * Renders the documented close failures with actionable wording rather than the
 * raw server message: the API distinguishes "you are not senior enough" from
 * "this ASN can no longer be closed", and those need different next steps.
 */
function CloseErrorNotice({ error }: { error: NormalizedApiError }) {
  const approvalRequired = error.code === 'ASN_CLOSE_APPROVAL_REQUIRED';
  const conflicting = error.httpStatus === 409;
  const required = error.requiredState?.length ? error.requiredState.join(', ') : null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        <p>
          {approvalRequired
            ? 'Manager approval required — a warehouse manager must close this ASN for the destination warehouse.'
            : error.message || 'The ASN could not be closed.'}
        </p>
        {error.hint && <p className="text-muted-foreground">{error.hint}</p>}
        {error.currentState && (
          <p className="text-muted-foreground">
            Current state: {error.currentState}
            {required ? ` · required: ${required}` : ''}
          </p>
        )}
        {conflicting && <p className="text-muted-foreground">The closure is final — refresh the list to see the current state.</p>}
      </div>
    </div>
  );
}

interface CloseBodyProps {
  summary: AsnReceivingSummary | null;
  summaryLoading: boolean;
  summaryFailed: boolean;
  reasonRequired: boolean;
  shortQty: number;
  reasonCode: string;
  reasons: InboundExceptionReason[];
  reasonsLoading: boolean;
  reasonsFailed: boolean;
  note: string;
  error: NormalizedApiError | null;
  onReasonChange: (code: string) => void;
  onNoteChange: (next: string) => void;
  onReloadReasons: () => void;
}

function CloseBody({
  summary,
  summaryLoading,
  summaryFailed,
  reasonRequired,
  shortQty,
  reasonCode,
  reasons,
  reasonsLoading,
  reasonsFailed,
  note,
  error,
  onReasonChange,
  onNoteChange,
  onReloadReasons,
}: CloseBodyProps) {
  const showPositionNotice = !summaryLoading && !summaryFailed;

  return (
    <div className="space-y-4">
      <ReceivingPosition summary={summary}
        loading={summaryLoading}
        failed={summaryFailed}
        isShortDelivery={reasonRequired} />

      {showPositionNotice && (reasonRequired ? <ShortfallNotice shortQty={shortQty} /> : <NoShortfallNotice />)}

      <ReasonField required={reasonRequired}
        value={reasonCode}
        reasons={reasons}
        loading={reasonsLoading}
        failed={reasonsFailed}
        onChange={onReasonChange}
        onReload={onReloadReasons} />

      <NoteField value={note} onChange={onNoteChange} />

      {error && <CloseErrorNotice error={error} />}
    </div>
  );
}

export interface CloseAsnOrderDialogProps {
  /** The ASN being closed. `null` closes the dialog. */
  order: AsnOrder | null;
  onOpenChange: (open: boolean) => void;
  /** Performs the close and resolves with the updated ASN. */
  onClose: (id: string, payload: AsnOrderClosePayload) => Promise<AsnOrder>;
  onClosed?: (order: AsnOrder) => void;
  /** The ASN vanished (`404`) or is no longer closable, so the caller must refetch. */
  onStale?: () => void;
}

/**
 * Formal closure of an ASN, including acceptance of a short delivery.
 *
 * Closing is terminal and also writes off every open shortage balance on the
 * ASN, so the result is never applied optimistically — the list is refreshed
 * from the server response alone.
 */
export function CloseAsnOrderDialog({ order, onOpenChange, onClose, onClosed, onStale }: CloseAsnOrderDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const open = !!order;
  const orderId = order?.id;
  const [reasonCode, setReasonCode] = React.useState('');
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  const { reasons, loading: reasonsLoading, error: reasonsError, reload: reloadReasons } = useExceptionReasons(open, 'short');

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery<AsnReceivingSummary>({
    queryKey: ['asn-receiving-summary', orderId],
    queryFn: () => asnOrderApi.getReceivingSummary(accessToken || '', orderId || '') as Promise<AsnReceivingSummary>,
    enabled: !!accessToken && !!orderId && open,
    retry: false,
  });

  // Re-seed for every ASN so a second close never inherits the previous form.
  React.useEffect(() => {
    setReasonCode('');
    setNote('');
    setError(null);
  }, [orderId]);

  const shortQty = shortfallQty(summary);
  // A reason is only mandatory when something is actually short; a fully
  // delivered ASN closes with an empty payload.
  const reasonRequired = shortQty > 0;

  const submit = async () => {
    if (!orderId) return;
    if (reasonRequired && !reasonCode) {
      setError({
        httpStatus: 400,
        code: 'SHORTAGE_REASON_REQUIRED',
        message: `${fmtQty(shortQty)} unit(s) are still outstanding — select a reason before closing.`,
        fields: [{ field: 'reason_code', hint: 'Every accepted shortfall needs an auditable reason.' }],
      });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const closed = await onClose(orderId, buildClosePayload(reasonCode, note));
      onClosed?.(closed);
      onOpenChange(false);
    } catch (err) {
      const normalized = toNormalizedApiError(err);
      const recovery = closeErrorRecovery(normalized);
      if (recovery.reloadReasons) {
        reloadReasons();
        setReasonCode('');
      }
      if (recovery.stale) onStale?.();
      setError(normalized);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Close ASN Order</DialogTitle>
          <DialogDescription>
            Closing is final. Any quantity that never arrived is accepted as a loss and written off against{' '}
            <code className="font-medium">{order?.asn_order_no}</code>.
          </DialogDescription>
        </DialogHeader>

        <CloseBody summary={summary ?? null}
          summaryLoading={summaryLoading}
          summaryFailed={!!summaryError}
          reasonRequired={reasonRequired}
          shortQty={shortQty}
          reasonCode={reasonCode}
          reasons={reasons}
          reasonsLoading={reasonsLoading}
          reasonsFailed={!!reasonsError}
          note={note}
          error={error}
          onReasonChange={setReasonCode}
          onNoteChange={setNote}
          onReloadReasons={reloadReasons} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting || summaryLoading}>
            {submitting ? 'Closing…' : 'Close ASN Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
