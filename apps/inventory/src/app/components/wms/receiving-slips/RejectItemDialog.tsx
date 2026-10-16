import * as React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@horizon-sync/ui/components';

import type { ReceivingSlipGroupItem } from '../../../types/wms.types';
import type { NormalizedApiError } from '../../../utility/api/core';

export interface RejectItemDialogProps {
  /** Line being rejected. `null` closes the dialog. */
  item: ReceivingSlipGroupItem | null;
  submitting?: boolean;
  /** Server failure, shown in place so the reason can be corrected and retried. */
  error?: NormalizedApiError | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

/**
 * Rejecting a line is terminal for that unit and is reported to the supplier, so
 * the reason is captured in a dialog that shows which unit is being rejected —
 * never a browser `prompt()`.
 */
export function RejectItemDialog({ item, submitting = false, error, onOpenChange, onConfirm }: RejectItemDialogProps) {
  const [reason, setReason] = React.useState('');

  // Start clean for every line, so one unit's reason is never sent for another.
  React.useEffect(() => {
    setReason('');
  }, [item]);

  const trimmedReason = reason.trim();

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject receiving line</DialogTitle>
          <DialogDescription>
            The unit is taken out of this receipt and reported to the supplier. Rejecting a line cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="rounded-md bg-muted p-3 font-mono text-xs">
            {item?.sku} · {item?.serial_number}
          </p>

          <div className="space-y-1">
            <Label htmlFor="reject-item-reason">Reason *</Label>
            <Textarea id="reject-item-reason"
              value={reason}
              maxLength={2000}
              rows={3}
              placeholder="e.g. Carton crushed, unit visibly damaged"
              onChange={(event) => setReason(event.target.value)}/>
            {error && (
              <p className="text-xs text-destructive">
                {error.message}
                {error.hint ? <span className="mt-0.5 block text-muted-foreground">{error.hint}</span> : null}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!trimmedReason || submitting} onClick={() => onConfirm(trimmedReason)}>
            {submitting ? 'Rejecting…' : 'Reject line'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
