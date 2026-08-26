import * as React from 'react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Textarea } from '@horizon-sync/ui/components';
import { useUserStore } from '@horizon-sync/store';

import type { InboundExceptionReason, ReceivingSlipGroupItem } from '../../../types/wms.types';
import { inboundApi } from '../../../utility/api/wms';

type Classification = 'short' | 'damaged' | 'excess' | 'hold' | 'quarantine';

const DEFAULT_REASON: Record<Classification, string> = {
  short: 'SHORT_PHYSICAL',
  damaged: 'DAMAGED',
  excess: 'EXCESS',
  hold: 'HOLD',
  quarantine: 'QUARANTINE',
};

export function InboundExceptionDialog({
  open,
  onOpenChange,
  slipId,
  item,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  slipId: string;
  item: ReceivingSlipGroupItem | null;
  onCompleted: () => void;
}) {
  const token = useUserStore((state) => state.accessToken);
  const [reasons, setReasons] = React.useState<InboundExceptionReason[]>([]);
  const [classification, setClassification] = React.useState<Classification>('damaged');
  const [reasonCode, setReasonCode] = React.useState('DAMAGED');
  const [destination, setDestination] = React.useState<'HOLD' | 'QUARANTINE' | ''>('');
  const [note, setNote] = React.useState('');
  const [evidence, setEvidence] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !token) return;
    inboundApi.listExceptionReasons(token).then(setReasons).catch((err: Error) => setError(err.message));
  }, [open, token]);

  const requiresDestination = classification !== 'short';

  const submit = async () => {
    if (!token || !item) return;
    setSubmitting(true);
    setError(null);
    try {
      const exception = await inboundApi.classifyException(token, slipId, item.id, {
        classification,
        reason_code: reasonCode,
        destination: requiresDestination ? destination || undefined : undefined,
        note: note.trim() || undefined,
      });
      if (evidence) await inboundApi.uploadExceptionEvidence(token, exception.id, evidence);
      onCompleted();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to classify exception');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Classify inbound exception</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="rounded-md bg-muted p-3 font-mono">{item?.sku} · {item?.serial_number}</p>
          <div className="space-y-1">
            <Label htmlFor="inbound-classification">Classification</Label>
            <select id="inbound-classification" className="w-full rounded-md border bg-background px-3 py-2" value={classification}
              onChange={(event) => {
                const value = event.target.value as Classification;
                setClassification(value);
                setReasonCode(DEFAULT_REASON[value]);
                setDestination('');
              }}>
              <option value="short">Short</option>
              <option value="damaged">Damaged</option>
              <option value="excess">Excess</option>
              <option value="hold">Hold</option>
              <option value="quarantine">Quarantine</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="inbound-reason">Reason code</Label>
            <select id="inbound-reason" className="w-full rounded-md border bg-background px-3 py-2" value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}>
              {reasons.map((reason) => <option key={reason.code} value={reason.code}>{reason.code} — {reason.name}</option>)}
            </select>
          </div>
          {requiresDestination && (
            <div className="space-y-1">
              <Label htmlFor="inbound-destination">Physical destination</Label>
              <select id="inbound-destination" className="w-full rounded-md border bg-background px-3 py-2" value={destination}
                onChange={(event) => setDestination(event.target.value as 'HOLD' | 'QUARANTINE' | '')}>
                <option value="" disabled>Select a physical destination</option>
                <option value="HOLD">HOLD</option>
                <option value="QUARANTINE">QUARANTINE</option>
              </select>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="inbound-note">Note (optional)</Label>
            <Textarea id="inbound-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inbound-evidence">Photo or evidence (optional)</Label>
            <Input id="inbound-evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setEvidence(event.target.files?.[0] ?? null)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !reasonCode || (requiresDestination && !destination)}>{submitting ? 'Saving…' : 'Create exception'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
