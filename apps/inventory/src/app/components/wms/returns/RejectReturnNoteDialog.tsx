import * as React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@horizon-sync/ui/components';

import type { ReturnReceiptNoteDetail } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';

import { ReturnDialogError } from './ReturnDialogError';

export interface RejectReturnNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ReturnReceiptNoteDetail | null;
  onConfirm: (reason: string) => Promise<void>;
}

/** Rejecting needs a written reason: it is the only record of why the receipt was refused. */
export function RejectReturnNoteDialog({ open, onOpenChange, note, onConfirm }: RejectReturnNoteDialogProps) {
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setReason('');
    setError(null);
  }, [open]);

  const trimmed = reason.trim();

  const handleConfirm = async () => {
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      onOpenChange(false);
    } catch (err) {
      setError(toNormalizedApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject return receipt note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Give the reason for rejecting <span className="font-mono font-medium">{note?.note_no}</span>. The note is
            closed and the return is reported back to the dealer.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="return-reject-reason">Reason</Label>
            <Textarea id="return-reject-reason"
              value={reason}
              maxLength={2000}
              placeholder="e.g. Two units expected, only one arrived"
              onChange={(event) => setReason(event.target.value)}/>
          </div>

          {error && <ReturnDialogError error={error} onRetry={handleConfirm}/>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy || !trimmed}>
            {busy ? 'Rejecting…' : 'Reject note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
