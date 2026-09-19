import * as React from 'react';

import { Loader2, Package, RefreshCw, ShieldAlert, TriangleAlert } from 'lucide-react';

import {
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
import { useToast } from '@horizon-sync/ui/hooks';

import { useExceptionReasons } from '../../hooks/useExceptionReasons';
import type {
  InboundExceptionReason,
  PutAwayExceptionClassification,
  PutAwayExceptionDestination,
  PutAwayExceptionRequest,
  PutAwayExceptionScope,
} from '../../types/wms.types';
import { PUT_AWAY_EXCEPTION_CLASSIFICATIONS } from '../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../utility/api/core';

import { FieldError, fieldIssue } from './apiErrorFields';
import { destinationForCode, nextReasonCode, reasonsForFlag } from './flagReasonCodes';

const EMPTY = '\u2014';

const CLASSIFICATION_LABELS: Record<PutAwayExceptionClassification, string> = {
  damaged: 'Damaged',
  excess: 'Excess',
  hold: 'Hold',
  quarantine: 'Quarantine',
};

/** What each classification does, so the operator knows the effect on the stock. */
const CLASSIFICATION_HINTS: Record<PutAwayExceptionClassification, string> = {
  damaged: 'Visible damage. The stock is segregated instead of being put away.',
  excess: 'More, or unexpected, stock than the ASN records. Segregated for a decision.',
  hold: 'Operational hold. Segregated until a manager releases it.',
  quarantine: 'Quality or compliance quarantine. Segregated until it is investigated.',
};

/** A unit, or a whole master pack, that the manager is about to except. */
export interface PutAwayExceptionTarget {
  scope: PutAwayExceptionScope;
  /**
   * Request path id: the master pack's q-seal id for `pack`, otherwise the
   * put-away item id.
   */
  id: string;
  sku: string;
  productName: string;
  batchNumber: string | null;
  /**
   * Put-away items the exception covers: one for a unit, every addressable item
   * for a master pack.
   */
  unitCount: number;
  quantity: number;
  /** Every put-away item id covered, so a pack request is self-describing. */
  itemIds: string[];
}

export interface PutAwayExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Unit or pack being excepted. `null` closes the dialog. */
  target: PutAwayExceptionTarget | null;
  onConfirm: (target: PutAwayExceptionTarget, request: PutAwayExceptionRequest) => Promise<unknown>;
  /** The list or unit moved on (`404`), so the caller must refetch. */
  onStale?: () => void;
}

function scopeSentence(target: PutAwayExceptionTarget): string {
  if (target.scope === 'pack') {
    return `One exception will cover this master pack — ${target.unitCount} item(s), ${target.quantity} in total.`;
  }
  return `One exception will cover this single item — ${target.quantity}.`;
}

/** The request body, minus an empty note, so nothing is sent as `""`. */
export function buildRequest(
  target: PutAwayExceptionTarget,
  classification: PutAwayExceptionClassification,
  reasonCode: string,
  destination: string,
  note: string,
): PutAwayExceptionRequest {
  const request: PutAwayExceptionRequest = {
    classification,
    reason_code: reasonCode,
    destination: destination as PutAwayExceptionDestination,
    scope: target.scope,
    item_ids: target.itemIds,
  };
  const trimmed = note.trim();
  if (trimmed) request.note = trimmed;
  return request;
}

function PackBadge({ target }: { target: PutAwayExceptionTarget }) {
  const isPack = target.scope === 'pack';
  const Icon = isPack ? Package : ShieldAlert;

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${isPack ? 'border-amber-200 bg-amber-50/50 text-amber-700' : 'bg-muted/30 text-muted-foreground'}`}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{scopeSentence(target)}</span>
    </div>
  );
}

function ExceptionErrorNotice({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
  const retryable = error.httpStatus === 0 || error.httpStatus >= 500;
  const required = error.requiredState?.length ? error.requiredState.join(', ') : null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
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

function ReasonCodeField({
  options,
  loading,
  value,
  error,
  onChange,
}: {
  options: InboundExceptionReason[];
  loading: boolean;
  value: string;
  error: NormalizedApiError | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="putaway-exception-reason">Reason code *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="putaway-exception-reason">
          <SelectValue placeholder={loading ? 'Loading reasons…' : 'Select a reason'}/>
        </SelectTrigger>
        <SelectContent>
          {options.map((reason) => (
            <SelectItem key={reason.code} value={reason.code}>
              {reason.name} — {reason.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!loading && options.length === 0 && (
        <p className="text-xs text-muted-foreground">No reason codes are configured for this classification.</p>
      )}
      <FieldError issue={fieldIssue(error, 'reason_code')}/>
    </div>
  );
}

function DestinationField({ value, error, onChange }: {
  value: string;
  error: NormalizedApiError | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="putaway-exception-destination">Segregate to *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="putaway-exception-destination">
          <SelectValue placeholder="Select a destination"/>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HOLD">HOLD</SelectItem>
          <SelectItem value="QUARANTINE">QUARANTINE</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">The stock becomes non-pickable until a manager disposes of it.</p>
      <FieldError issue={fieldIssue(error, 'destination')}/>
    </div>
  );
}

function ExceptionForm({
  target,
  classification,
  onClassificationChange,
  options,
  reasonsLoading,
  reasonCode,
  onReasonCodeChange,
  destination,
  onDestinationChange,
  note,
  onNoteChange,
  error,
}: {
  target: PutAwayExceptionTarget;
  classification: PutAwayExceptionClassification;
  onClassificationChange: (value: PutAwayExceptionClassification) => void;
  options: InboundExceptionReason[];
  reasonsLoading: boolean;
  reasonCode: string;
  onReasonCodeChange: (value: string) => void;
  destination: string;
  onDestinationChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  error: NormalizedApiError | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Item</p>
          <p className="font-medium">{target.productName}</p>
          <p className="font-mono text-xs text-muted-foreground">{target.sku}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Batch / Quantity</p>
          <p className="font-mono text-xs">{target.batchNumber ?? EMPTY}</p>
          <p className="font-medium">{target.quantity}</p>
        </div>
      </div>

      <PackBadge target={target}/>

      <div className="space-y-1.5">
        <Label htmlFor="putaway-exception-classification">Classification *</Label>
        <Select value={classification} onValueChange={(value) => onClassificationChange(value as PutAwayExceptionClassification)}>
          <SelectTrigger id="putaway-exception-classification">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent>
            {PUT_AWAY_EXCEPTION_CLASSIFICATIONS.map((value) => (
              <SelectItem key={value} value={value}>{CLASSIFICATION_LABELS[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{CLASSIFICATION_HINTS[classification]}</p>
        <FieldError issue={fieldIssue(error, 'classification')}/>
      </div>

      <ReasonCodeField options={options}
        loading={reasonsLoading}
        value={reasonCode}
        error={error}
        onChange={onReasonCodeChange}/>

      <DestinationField value={destination} error={error} onChange={onDestinationChange}/>

      <div className="space-y-1.5">
        <Label htmlFor="putaway-exception-note">Note</Label>
        <Textarea id="putaway-exception-note"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="What is wrong with this stock? e.g. carton crushed on the left side."
          rows={3}/>
        <FieldError issue={fieldIssue(error, 'note')}/>
      </div>
    </div>
  );
}

/**
 * Raises an inbound exception for stock found unfit while being put away — on a
 * single unit, or on a whole master pack as one exception.
 *
 * A put-away exception is always manager-facing: the units leave the put-away
 * list and land in the hold/quarantine queue for disposition.
 */
export function PutAwayExceptionDialog({ open, onOpenChange, target, onConfirm, onStale }: PutAwayExceptionDialogProps) {
  const { toast } = useToast();
  const { reasons, loading: reasonsLoading, error: reasonsError, reload: reloadReasons } = useExceptionReasons(open);

  const [classification, setClassification] = React.useState<PutAwayExceptionClassification>('damaged');
  const [reasonCode, setReasonCode] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  const targetId = target?.id ?? null;

  // Start clean for every unit/pack, so nothing is inherited from the last one.
  React.useEffect(() => {
    if (!open) return;
    setClassification('damaged');
    setReasonCode('');
    setDestination('');
    setNote('');
    setError(null);
  }, [open, targetId]);

  // Keep the reason inside the selected classification's category.
  React.useEffect(() => {
    setReasonCode((current) => nextReasonCode(reasons, classification, current));
  }, [reasons, classification]);

  // Prefill the bin the reason suggests, without overriding a deliberate choice.
  React.useEffect(() => {
    const suggested = destinationForCode(reasons, reasonCode);
    setDestination((current) => current || suggested || '');
  }, [reasons, reasonCode]);

  const options = reasonsForFlag(reasons, classification);
  const canSubmit = Boolean(reasonCode) && Boolean(destination) && !busy;

  const handleConfirm = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(target, buildRequest(target, classification, reasonCode, destination, note));
      toast({
        title: target.scope === 'pack' ? 'Master pack excepted' : 'Unit excepted',
        description: `${target.sku} · ${CLASSIFICATION_LABELS[classification]} → ${destination}. Sent to the exception queue for disposition.`,
      });
      onOpenChange(false);
    } catch (err) {
      const normalized = toNormalizedApiError(err);
      setError(normalized);
      if (normalized.code === 'REASON_CODE_INVALID') {
        // The reference list is stale: refetch it and force a fresh choice.
        reloadReasons();
        setReasonCode('');
        return;
      }
      if (normalized.httpStatus === 404) {
        // The list or the unit moved on underneath us — refresh and close.
        onStale?.();
        onOpenChange(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Raise exception {target ? `— ${target.sku}` : ''}</DialogTitle>
          <DialogDescription>
            Excepting stock is terminal for the put-away line: the unit is not put away and instead waits for a
            manager&apos;s disposition.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <ExceptionForm target={target}
            classification={classification}
            onClassificationChange={setClassification}
            options={options}
            reasonsLoading={reasonsLoading}
            reasonCode={reasonCode}
            onReasonCodeChange={setReasonCode}
            destination={destination}
            onDestinationChange={setDestination}
            note={note}
            onNoteChange={setNote}
            error={error}/>
        )}

        {reasonsError && <ExceptionErrorNotice error={reasonsError} onRetry={reloadReasons}/>}
        {error && <ExceptionErrorNotice error={error} onRetry={handleConfirm}/>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canSubmit}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin"/> : <ShieldAlert className="mr-1 h-3.5 w-3.5"/>}
            Raise Exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
