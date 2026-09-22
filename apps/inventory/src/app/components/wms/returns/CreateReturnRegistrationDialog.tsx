import * as React from 'react';

import { Loader2, Search } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
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
import { useReturnReference } from '../../../hooks/useWMS';
import type {
  CreateReturnRegistrationRequest,
  InboundExceptionReason,
  ReturnReference,
  ReturnReferenceLine,
  ReturnReferenceType,
  ReturnRegistrationDetail,
} from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';

import { ReturnDialogError } from './ReturnDialogError';
import { EMPTY } from './returnNotes';
import {
  buildRegistrationLines,
  canSubmitRegistration,
  initialLineDrafts,
  lineDraftError,
  registrationReasonOptions,
  registrationTotalQty,
  returnableLines,
  type RegistrationDraftState,
  type RegistrationLineDraft,
} from './returnRegistrations';

/** Debounce before the reference lookup fires, so typing an invoice is one request. */
const LOOKUP_DEBOUNCE_MS = 350;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ---- Reference lookup --------------------------------------------------- */

function ReferenceLookup({
  type,
  invoiceNo,
  loading,
  error,
  onTypeChange,
  onInvoiceChange,
  onRetry,
}: {
  type: string;
  invoiceNo: string;
  loading: boolean;
  error: NormalizedApiError | null;
  onTypeChange: (value: string) => void;
  onInvoiceChange: (value: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="return-reference-type">Reference</Label>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger id="return-reference-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Only an invoice resolves lines (§4.1), and a dealer/warehouse reference
                would also need a party picker — neither mode is offered until then. */}
            <SelectItem value="invoice">Invoice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="return-invoice-no">Invoice number</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="return-invoice-no"
            className="pl-10"
            value={invoiceNo}
            placeholder="INV-2026-00123"
            onChange={(event) => onInvoiceChange(event.target.value)}/>
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {error && <div className="sm:col-span-2"><ReturnDialogError error={error} onRetry={onRetry}/></div>}
    </div>
  );
}

function InvoiceSummary({ reference, warehouseName }: { reference: ReturnReference; warehouseName: string | null }) {
  const invoice = reference.invoice;
  if (!invoice) return null;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium">
        {invoice.invoice_no}
        <span className="ml-2 text-xs font-normal text-muted-foreground">{invoice.status ?? EMPTY}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {invoice.party?.name ?? EMPTY} · {invoice.warehouse?.name ?? warehouseName ?? EMPTY}
        {invoice.grand_total !== null ? ` · ${invoice.currency ?? ''} ${invoice.grand_total}` : ''}
      </p>
    </div>
  );
}

/* ---- Line editor -------------------------------------------------------- */

function RegistrationLineRow({
  line,
  draft,
  error,
  onChange,
}: {
  line: ReturnReferenceLine;
  draft: RegistrationLineDraft;
  error: string | null;
  onChange: (patch: Partial<RegistrationLineDraft>) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border p-3">
      <div className="flex items-start gap-3">
        <input type="checkbox"
          className="mt-1"
          aria-label={`Return ${line.sku}`}
          checked={draft.included}
          onChange={(event) => onChange({ included: event.target.checked })}/>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{line.item_name ?? line.sku}</p>
          <p className="font-mono text-xs text-muted-foreground">{line.sku}</p>
          <p className="text-xs text-muted-foreground">
            Invoiced {line.invoiced_qty} · already returned {line.already_returned_qty} · returnable{' '}
            <span className="font-medium text-foreground">{line.returnable_qty}</span>
          </p>
        </div>
      </div>

      {draft.included && (
        <div className="grid gap-3 pl-7 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`return-qty-${line.line_id}`}>Quantity {line.uom ? `(${line.uom})` : ''}</Label>
            <Input id={`return-qty-${line.line_id}`}
              type="number"
              min={1}
              max={line.returnable_qty}
              value={draft.quantity}
              onChange={(event) => onChange({ quantity: event.target.value })}/>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`return-serials-${line.line_id}`}>Serials (optional)</Label>
            <Input id={`return-serials-${line.line_id}`}
              value={draft.serials}
              placeholder="Comma separated"
              onChange={(event) => onChange({ serials: event.target.value })}/>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationLines({
  lines,
  drafts,
  onDraftChange,
}: {
  lines: ReturnReferenceLine[];
  drafts: RegistrationLineDraft[];
  onDraftChange: (lineId: string, patch: Partial<RegistrationLineDraft>) => void;
}) {
  return (
    <div className="space-y-2">
      {lines.map((line) => {
        const draft = drafts.find((entry) => entry.lineId === line.line_id);
        if (!draft) return null;
        return (
          <RegistrationLineRow key={line.line_id}
            line={line}
            draft={draft}
            error={draft.included ? lineDraftError(line, draft) : null}
            onChange={(patch) => onDraftChange(line.line_id, patch)}/>
        );
      })}
    </div>
  );
}

/* ---- Dialog ------------------------------------------------------------- */

interface RegistrationFormValues {
  referenceType: string;
  lookupKey: string;
  warehouseId: string;
  reasonCode: string;
  returnDate: string;
  note: string;
}

/** The payload mirrors §5.1: only the selected, validated lines travel. */
function buildRegistrationPayload(form: RegistrationFormValues, state: RegistrationDraftState): CreateReturnRegistrationRequest {
  return {
    reference_type: form.referenceType as ReturnReferenceType,
    invoice_no: form.referenceType === 'invoice' ? form.lookupKey : undefined,
    warehouse_id: form.warehouseId,
    return_reason_code: form.reasonCode,
    return_date: form.returnDate || undefined,
    note: form.note.trim() || undefined,
    lines: buildRegistrationLines(state),
  };
}

/** The header's warehouse wins; otherwise the reference's suggestion. */
function resolveWarehouseId(warehouseId: string | undefined, reference: ReturnReference | null): string {
  return warehouseId ?? reference?.suggested_warehouse_id ?? '';
}

/**
 * Reason codes a registration may use, kept inside the accepted categories as the
 * tenant's list loads.
 */
function useRegistrationReason() {
  const { reasons, loading, error, reload } = useExceptionReasons(true);
  const options = React.useMemo(() => registrationReasonOptions(reasons), [reasons]);
  const [reasonCode, setReasonCode] = React.useState('');

  React.useEffect(() => {
    setReasonCode((current) => (options.some((option) => option.code === current) ? current : (options[0]?.code ?? '')));
  }, [options]);

  return { reasonCode, setReasonCode, reasonOptions: options, reasonsLoading: loading, reasonsError: error, reloadReasons: reload };
}

/** The invoice summary plus the editable lines, or a note when nothing is returnable. */
function ReferenceLines({
  reference,
  lines,
  drafts,
  onDraftChange,
}: {
  reference: ReturnReference | null;
  lines: ReturnReferenceLine[];
  drafts: RegistrationLineDraft[];
  onDraftChange: (lineId: string, patch: Partial<RegistrationLineDraft>) => void;
}) {
  if (!reference) return null;

  if (lines.length === 0) {
    return (
      <p className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
        Nothing on this invoice is still returnable.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <InvoiceSummary reference={reference} warehouseName={null}/>
      <p className="text-xs font-medium text-muted-foreground">Lines to return</p>
      <RegistrationLines lines={lines} drafts={drafts} onDraftChange={onDraftChange}/>
    </div>
  );
}

function RegistrationFields({
  reasonCode,
  reasonOptions,
  reasonsLoading,
  returnDate,
  note,
  onReasonChange,
  onDateChange,
  onNoteChange,
}: {
  reasonCode: string;
  reasonOptions: InboundExceptionReason[];
  reasonsLoading: boolean;
  returnDate: string;
  note: string;
  onReasonChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  const reasonPlaceholder = reasonsLoading ? 'Loading…' : 'Select a reason';

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="return-reason">Return reason</Label>
          <Select value={reasonCode} onValueChange={onReasonChange} disabled={reasonsLoading || reasonOptions.length === 0}>
            <SelectTrigger id="return-reason">
              <SelectValue placeholder={reasonPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {reasonOptions.map((reason) => (
                <SelectItem key={reason.code} value={reason.code}>
                  {reason.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="return-date">Return date</Label>
          <Input id="return-date" type="date" value={returnDate} onChange={(event) => onDateChange(event.target.value)}/>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="return-note">Note</Label>
        <Textarea id="return-note"
          value={note}
          maxLength={2000}
          placeholder="What the dealer reported"
          onChange={(event) => onNoteChange(event.target.value)}/>
      </div>
    </>
  );
}

function RegistrationFooter({
  busy,
  canSubmit,
  units,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  canSubmit: boolean;
  units: number;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogFooter>
      <Button variant="ghost" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={busy || !canSubmit}>
        {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
        Register {units} unit(s)
      </Button>
    </DialogFooter>
  );
}

export interface CreateReturnRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Warehouse selected in the WMS header; the reference may suggest another. */
  warehouseId?: string;
  /** The owning list performs the POST and invalidates the queue. */
  onCreate: (payload: CreateReturnRegistrationRequest) => Promise<ReturnRegistrationDetail>;
  onCreated: (registration: ReturnRegistrationDetail) => void;
}

/**
 * Registration form (§5.1) built on the reference lookup (§4.1): the operator
 * picks a real invoice, so quantities are capped at what is actually returnable
 * and lines with nothing left to return never appear.
 */
export function CreateReturnRegistrationDialog({ open, onOpenChange, warehouseId, onCreate, onCreated }: CreateReturnRegistrationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Keyed by `open`, so every opening mounts a clean form with no reset effect. */}
      {open && (
        <RegistrationForm warehouseId={warehouseId}
          onCreate={onCreate}
          onCreated={onCreated}
          onClose={() => onOpenChange(false)}/>
      )}
    </Dialog>
  );
}

function RegistrationForm({
  warehouseId,
  onCreate,
  onCreated,
  onClose,
}: {
  warehouseId?: string;
  onCreate: (payload: CreateReturnRegistrationRequest) => Promise<ReturnRegistrationDetail>;
  onCreated: (registration: ReturnRegistrationDetail) => void;
  onClose: () => void;
}) {
  const { reasonCode, setReasonCode, reasonOptions, reasonsLoading, reasonsError, reloadReasons } = useRegistrationReason();

  const [referenceType, setReferenceType] = React.useState('invoice');
  const [invoiceNo, setInvoiceNo] = React.useState('');
  const [lookupKey, setLookupKey] = React.useState('');
  const [returnDate, setReturnDate] = React.useState(todayIso);
  const [note, setNote] = React.useState('');
  const [drafts, setDrafts] = React.useState<RegistrationLineDraft[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  // Debounced lookup: the endpoint is safe per keystroke but one call per pause is enough.
  React.useEffect(() => {
    const timer = setTimeout(() => setLookupKey(invoiceNo.trim()), LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [invoiceNo]);

  const { reference: resolvedReference, loading: referenceLoading, error: referenceError, refetch } = useReturnReference({
    invoice_no: referenceType === 'invoice' ? lookupKey : undefined,
    warehouse_id: warehouseId,
  });

  // The typed value outruns the debounced key, so until the two agree the resolved
  // reference still belongs to the previous invoice and must not be submittable.
  const lookupPending = invoiceNo.trim() !== lookupKey;
  const reference = lookupPending ? null : resolvedReference;

  const lines = returnableLines(reference);

  // A new reference resets the editable rows.
  React.useEffect(() => {
    setDrafts(initialLineDrafts(reference));
  }, [reference]);

  const state: RegistrationDraftState = { reference, drafts, reasonCode };
  const effectiveWarehouseId = resolveWarehouseId(warehouseId, reference);
  const canSubmit = canSubmitRegistration(state) && Boolean(effectiveWarehouseId);

  const handleDraftChange = (lineId: string, patch: Partial<RegistrationLineDraft>) => {
    setDrafts((current) => current.map((draft) => (draft.lineId === lineId ? { ...draft, ...patch } : draft)));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const payload = buildRegistrationPayload(
        { referenceType, lookupKey, warehouseId: effectiveWarehouseId, reasonCode, returnDate, note },
        state,
      );
      const created = await onCreate(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(toNormalizedApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Register a return</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        <ReferenceLookup type={referenceType}
          invoiceNo={invoiceNo}
          loading={referenceLoading || lookupPending}
          error={referenceError}
          onTypeChange={setReferenceType}
          onInvoiceChange={setInvoiceNo}
          onRetry={refetch}/>

        <ReferenceLines reference={reference} lines={lines} drafts={drafts} onDraftChange={handleDraftChange}/>

        <RegistrationFields reasonCode={reasonCode}
          reasonOptions={reasonOptions}
          reasonsLoading={reasonsLoading}
          returnDate={returnDate}
          note={note}
          onReasonChange={setReasonCode}
          onDateChange={setReturnDate}
          onNoteChange={setNote}/>

        {reasonsError && <ReturnDialogError error={reasonsError} onRetry={reloadReasons}/>}
        {error && <ReturnDialogError error={error} onRetry={handleSubmit}/>}
      </div>

      <RegistrationFooter busy={busy}
        canSubmit={canSubmit}
        units={registrationTotalQty(state)}
        onCancel={onClose}
        onSubmit={handleSubmit}/>
    </DialogContent>
  );
}
