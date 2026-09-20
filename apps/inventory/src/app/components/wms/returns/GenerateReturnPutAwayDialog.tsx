import * as React from 'react';

import { Loader2, PackageCheck, TriangleAlert } from 'lucide-react';

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

import { useWarehouseWorkers } from '../../../hooks/useWMS';
import type { GenerateReturnPutAwayRequest, GenerateReturnPutAwayResponse, ReturnReceiptNoteDetail } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { WorkerLoadError, WorkerMultiSelect } from '../WorkerMultiSelect';

import { ReturnDialogError } from './ReturnDialogError';
import { EMPTY, noteLines } from './returnNotes';

/** How the note splits: what enters put-away, and what stays segregated (§6.6). */
function putAwayPreview(note: ReturnReceiptNoteDetail | null) {
  const lines = noteLines(note);
  const releasing = lines.filter((entry) => entry.item.disposition === 'release_to_stock');

  return {
    lines: releasing.length,
    units: releasing.reduce((sum, entry) => sum + (entry.item.quantity || 0), 0),
    segregated: lines.length - releasing.length,
  };
}

export interface GenerateReturnPutAwayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ReturnReceiptNoteDetail | null;
  onGenerate: (payload: GenerateReturnPutAwayRequest) => Promise<GenerateReturnPutAwayResponse>;
  onGenerated: (result: GenerateReturnPutAwayResponse) => void;
}

/**
 * Creates the put-away lists for the lines routed to stock and leaves the rest in
 * the non-pickable bins. Good stock is not available until the handheld completes
 * put-away, so this dialog never claims it is.
 */
export function GenerateReturnPutAwayDialog({ open, onOpenChange, note, onGenerate, onGenerated }: GenerateReturnPutAwayDialogProps) {
  const [workerIds, setWorkerIds] = React.useState<string[]>([]);
  const [noteText, setNoteText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  // Workers come from the note's own warehouse, not the header selection.
  const { workers, error: workersError } = useWarehouseWorkers(note?.warehouse?.id, open);
  const preview = putAwayPreview(note);

  React.useEffect(() => {
    if (!open) return;
    setWorkerIds([]);
    setNoteText('');
    setError(null);
  }, [open, note?.id]);

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await onGenerate({
        worker_ids: workerIds.length > 0 ? workerIds : undefined,
        note: noteText.trim() || undefined,
      });
      onGenerated(result);
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
          <DialogTitle>Generate put-away</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium">{note?.note_no ?? EMPTY}</p>
            <p className="text-xs text-muted-foreground">
              {preview.lines} line(s) · {preview.units} unit(s) enter put-away · {preview.segregated} line(s) stay segregated
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Assign workers (optional)</Label>
            <WorkerMultiSelect workers={workers} selected={workerIds} onChange={setWorkerIds} />
            <WorkerLoadError error={workersError} />
            <p className="text-xs text-muted-foreground">Selecting more than one worker splits the items across separate put-away lists.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-putaway-note">Note</Label>
            <Textarea id="return-putaway-note"
              value={noteText}
              maxLength={2000}
              placeholder="Optional context recorded with the put-away"
              onChange={(event) => setNoteText(event.target.value)}/>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Released stock becomes available only once the handheld confirms the put-away, not straight away.</span>
          </div>

          {error && <ReturnDialogError error={error} onRetry={handleGenerate}/>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={busy || !note || preview.lines === 0}>
            {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="mr-1 h-3.5 w-3.5" />}
            Generate put-away
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
