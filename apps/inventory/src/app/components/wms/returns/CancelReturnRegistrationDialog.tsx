import * as React from 'react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from '@horizon-sync/ui/components';

import type { NormalizedApiError } from '../../../utility/api/core';
import { toNormalizedApiError } from '../../../utility/api/core';

import { ReturnDialogError } from './ReturnDialogError';

/** Only the identity is needed: the dialog cancels by id. */
export interface ReturnRegistrationTarget {
  id: string;
  registration_no: string;
}

export interface CancelReturnRegistrationDialogProps {
  /** Registration being cancelled. `null` closes the dialog. */
  registration: ReturnRegistrationTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (registrationId: string, reason: string) => Promise<void>;
}

/** The dock has not scanned anything yet, so cancelling is a decision, not a stock move. */
export function CancelReturnRegistrationDialog({ registration, onOpenChange, onConfirm }: CancelReturnRegistrationDialogProps) {
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  React.useEffect(() => {
    if (!registration) return;
    setReason('');
    setError(null);
  }, [registration]);

  const trimmed = reason.trim();

  const handleConfirm = async () => {
    if (!registration || !trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(registration.id, trimmed);
      onOpenChange(false);
    } catch (err) {
      setError(toNormalizedApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(registration)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel return registration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Cancelling <span className="font-mono font-medium">{registration?.registration_no}</span> closes the return. The
            dock can no longer receive against it.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="return-cancel-reason">Reason</Label>
            <Textarea id="return-cancel-reason"
              value={reason}
              maxLength={2000}
              placeholder="e.g. Dealer cancelled the collection"
              onChange={(event) => setReason(event.target.value)}/>
          </div>
          {error && <ReturnDialogError error={error} onRetry={handleConfirm}/>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep registration
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy || !trimmed}>
            {busy ? 'Cancelling…' : 'Cancel registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
