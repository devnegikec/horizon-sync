import * as React from 'react';

import { CheckCircle2 } from 'lucide-react';

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
import { EMPTY, groupQuantity } from './returnNotes';

export interface ApproveReturnNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ReturnReceiptNoteDetail | null;
  onConfirm: (note?: string) => Promise<void>;
}

/** What approval does to stock, per condition — approval moves stock, never a no-op. */
function RoutingPreview({ note }: { note: ReturnReceiptNoteDetail }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium">
        {note.note_no} · {note.groups.length} product(s)
      </p>
      <p className="text-xs text-muted-foreground">
        Expected {note.expected_qty} · Received {note.received_qty} · Short {note.short_qty}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        {note.groups.map((group, index) => (
          <li key={`${group.sku ?? group.product_name}-${index}`}>
            {group.product_name} <span className="font-mono">{group.sku ?? EMPTY}</span> · {groupQuantity(group)} unit(s)
          </li>
        ))}
      </ul>
      <p className="pt-1 text-xs text-muted-foreground">
        Good lines enter put-away (available only after the handheld confirms); everything else stays segregated in a
        non-pickable bin.
      </p>
    </div>
  );
}

/** Confirms the supervisor's sign-off (§6.3); lines with no disposition keep the dock's routing. */
export function ApproveReturnNoteDialog({ open, onOpenChange, note, onConfirm }: ApproveReturnNoteDialogProps) {
  const [approvalNote, setApprovalNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setApprovalNote('');
    setError(null);
  }, [open]);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(approvalNote.trim() || undefined);
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
          <DialogTitle>Approve return receipt note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {note && <RoutingPreview note={note}/>}

          <div className="space-y-1.5">
            <Label htmlFor="return-approval-note">Approval note</Label>
            <Textarea id="return-approval-note"
              value={approvalNote}
              maxLength={2000}
              placeholder="Optional context recorded with the approval"
              onChange={(event) => setApprovalNote(event.target.value)}/>
          </div>

          {error && <ReturnDialogError error={error} onRetry={handleConfirm}/>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={busy || !note}>
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            {busy ? 'Approving…' : 'Approve note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
