import * as React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
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

import { useExceptionReasons } from '../../../hooks/useExceptionReasons';
import type { ReturnDispositionAction } from '../../../types/wms.types';
import type { NormalizedApiError } from '../../../utility/api/core';

import { ReturnConditionBadge } from './ReturnConditionBadge';
import { ReturnDialogError } from './ReturnDialogError';
import {
  defaultDisposition,
  DISPOSITION_LABELS,
  dispositionLabel,
  dispositionReasonOptions,
  dispositionsForLine,
  EMPTY,
  nextDispositionReason,
  type ReturnNoteLine,
} from './returnNotes';

export interface ReturnDispositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Line being decided; `null` while nothing is targeted. */
  line: ReturnNoteLine | null;
  onConfirm: (action: ReturnDispositionAction, reasonCode?: string, note?: string) => Promise<void>;
}


function LineSummary({ line }: { line: ReturnNoteLine }) {
  const { item, group } = line;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium">{group.product_name}</p>
      <p className="font-mono text-xs text-muted-foreground">
        {group.sku ?? EMPTY}
        {item.serial_number ? ` · ${item.serial_number}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ReturnConditionBadge condition={item.condition}/>
        <span>Qty {item.quantity}</span>
        {item.destination && <span>Destination {item.destination}</span>}
        <span>Current: {dispositionLabel(item.disposition)}</span>
      </div>
      {item.note && <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>}
    </div>
  );
}

/**
 * Per-line disposition (§6.5). The action list is constrained by the line's
 * condition and the reason by the chosen action, so the pair the API rejects with
 * `RETURN_DISPOSITION_INVALID` cannot be composed here.
 */
export function ReturnDispositionDialog({ open, onOpenChange, line, onConfirm }: ReturnDispositionDialogProps) {
  const { reasons, loading: reasonsLoading, error: reasonsError, reload } = useExceptionReasons(open);
  const [action, setAction] = React.useState<ReturnDispositionAction>('move_to_hold');
  const [reasonCode, setReasonCode] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  // Seed each newly targeted line from its own condition.
  React.useEffect(() => {
    if (!open || !line) return;
    setAction(defaultDisposition(line.item));
    setReasonCode('');
    setNote('');
    setError(null);
  }, [open, line]);

  // Changing the action can move the reason into another category.
  React.useEffect(() => {
    if (!open || !line) return;
    setReasonCode((current) => nextDispositionReason(reasons, line.item, action, current));
  }, [open, line, action, reasons]);

  const options = line ? dispositionsForLine(line.item) : [];
  const reasonOptions = line ? dispositionReasonOptions(reasons, line.item, action) : [];

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(action, reasonCode || undefined, note.trim() || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err as NormalizedApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Disposition line</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {line && <LineSummary line={line}/>}

          <div className="space-y-1.5">
            <Label htmlFor="return-disposition-action">Action</Label>
            <Select value={action} onValueChange={(value) => setAction(value as ReturnDispositionAction)}>
              <SelectTrigger id="return-disposition-action">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {DISPOSITION_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-disposition-reason">Reason</Label>
            <Select value={reasonCode} onValueChange={setReasonCode} disabled={reasonsLoading || reasonOptions.length === 0}>
              <SelectTrigger id="return-disposition-reason">
                <SelectValue placeholder={reasonsLoading ? 'Loading…' : 'Select a reason code'} />
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
            <Label htmlFor="return-disposition-note">Note</Label>
            <Textarea id="return-disposition-note"
              value={note}
              maxLength={2000}
              placeholder="Context for the audit trail"
              onChange={(event) => setNote(event.target.value)}/>
          </div>

          {reasonsError && <ReturnDialogError error={reasonsError} onRetry={reload}/>}
          {error && <ReturnDialogError error={error} onRetry={handleConfirm}/>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={busy || !line} onClick={handleConfirm}>
            {busy ? 'Saving…' : 'Record disposition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
