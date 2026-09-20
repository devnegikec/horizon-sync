import * as React from 'react';

import { Loader2, PackageOpen, TriangleAlert } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { DialogFooter } from '@horizon-sync/ui/components/ui/dialog';
import { useToast } from '@horizon-sync/ui/hooks';

import { useWarehouseWorkers } from '../../hooks/useWMS';
import type { PutAwayList, PutAwayListBatchResponse, ReceivingSlip } from '../../types/wms.types';
import { DetailDialogContainer } from '../common';

import { WorkerMultiSelect } from './WorkerMultiSelect';

export type PutAwayGenerationMode = 'default' | 'auto' | 'manual';

interface GeneratePutAwayDialogProps {
  slip: ReceivingSlip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (slipId: string, options?: { mode?: 'auto' | 'manual'; workerIds?: string[] }) => Promise<PutAwayList | PutAwayListBatchResponse>;
}

/** Human-readable hint for the selected generation mode. */
function modeHint(mode: PutAwayGenerationMode): string {
  if (mode === 'manual') {
    return 'Items are grouped by SKU/batch without bin assignment; workers choose bins when completing each item.';
  }
  if (mode === 'auto') {
    return 'The server assigns bins and sorts items along the optimal walking route.';
  }
  return 'Uses the organisation default put-away mode (auto unless overridden in settings).';
}

function generationToast(result: PutAwayList | PutAwayListBatchResponse, slipNumber: string): { title: string; description: string } {
  const lists = 'put_away_lists' in result ? result.put_away_lists : [result];
  const warnings = lists.flatMap((l) => l.warnings ?? []);
  const summary =
    lists.length > 1
      ? `${lists.length} put-away lists created from ${slipNumber}: ${lists.map((l) => l.put_away_list_no).join(', ')}`
      : `Put-away list ${lists[0].put_away_list_no} created from ${slipNumber}`;
  return {
    title: lists.length > 1 ? 'Put-away lists generated' : 'Put-away generated',
    description: warnings.length > 0 ? `${summary} — ${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}` : `${summary}.`,
  };
}

/**
 * Generation dialog for creating a put-away list from an approved receiving slip.
 *
 * Mode resolution matches the backend contract:
 *   - `default` → omit `mode` so the server honours the org `putaway_mode` setting.
 *   - `auto`    → server assigns bins + optimal walking route.
 *   - `manual`  → list created without bin assignment; worker assigns bins at completion.
 */
export function GeneratePutAwayDialog({ slip, open, onOpenChange, onGenerate }: GeneratePutAwayDialogProps) {
  const { toast } = useToast();

  const [mode, setMode] = React.useState<PutAwayGenerationMode>('default');
  const [workerIds, setWorkerIds] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  // Every assignable worker of the slip's warehouse, loaded while the dialog is open.
  const { workers } = useWarehouseWorkers(slip?.warehouse_id, open);

  // Reset form each time the dialog opens for a new slip.
  React.useEffect(() => {
    if (!open) return;
    setMode('default');
    setWorkerIds([]);
  }, [open, slip?.id]);

  const handleGenerate = async () => {
    if (!slip) return;
    setBusy(true);
    try {
      const result = await onGenerate(slip.id, {
        mode: mode === 'default' ? undefined : mode,
        workerIds: workerIds.length > 0 ? workerIds : undefined,
      });
      toast(generationToast(result, slip.slip_number));
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate put-away',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <DetailDialogContainer open={open}
      onOpenChange={onOpenChange}
      icon={PackageOpen}
      title="Generate Put-Away List"
      status={slip?.status ?? ''}
      statusBadge={false}
      contentClassName="sm:max-w-[460px]"
      subtitle={
        <p className="text-sm text-muted-foreground mt-1.5">
          Generate a put-away list from receiving slip <span className="font-mono font-medium text-foreground">{slip?.slip_number ?? ''}</span>.
        </p>
      }>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Generation Mode</p>
          <Select value={mode} onValueChange={(v) => setMode(v as PutAwayGenerationMode)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (org setting)</SelectItem>
              <SelectItem value="auto">Automatic — server assigns bins</SelectItem>
              <SelectItem value="manual">Manual — worker assigns bins</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{modeHint(mode)}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Assign Workers (optional)</p>
          <WorkerMultiSelect workers={workers} selected={workerIds} onChange={setWorkerIds} />
          <p className="text-xs text-muted-foreground">Selecting more than one worker splits the slip&apos;s items across separate put-away lists.</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
          <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Damaged, rejected, held, quarantined and excess lines are skipped automatically and reported as warnings.</span>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleGenerate} disabled={busy || !slip}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <PackageOpen className="h-3.5 w-3.5 mr-1" />}
          Generate
        </Button>
      </DialogFooter>
    </DetailDialogContainer>
  );
}
