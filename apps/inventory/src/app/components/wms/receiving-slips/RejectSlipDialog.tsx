import * as React from 'react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from '@horizon-sync/ui/components';

import type { ReceivingSlip } from '../../../types/wms.types';

export interface RejectSlipDialogProps {
  /** Slip being rejected. `null` closes the dialog. */
  slip: ReceivingSlip | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function RejectSlipDialog({ slip, loading = false, onOpenChange, onConfirm }: RejectSlipDialogProps) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (slip) setReason('');
  }, [slip]);

  const trimmedReason = reason.trim();

  return (
    <Dialog open={!!slip} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject receiving slip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Provide a reason for rejecting <span className="font-mono font-medium">{slip?.slip_number}</span>. The slip will be
            closed and reported to the supplier.
          </p>
          <div className="space-y-1">
            <Label htmlFor="slip-reject-reason">Reason</Label>
            <Textarea id="slip-reject-reason"
              value={reason}
              maxLength={2000}
              placeholder="e.g. Damaged cartons, quantity mismatch..."
              onChange={(event) => setReason(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!trimmedReason || loading} onClick={() => onConfirm(trimmedReason)}>
            {loading ? 'Rejecting…' : 'Reject slip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
