import * as React from 'react';

import { ChevronsUpDown, Loader2, PackageOpen, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { useToast } from '@horizon-sync/ui/hooks';

import type { PutAwayList, PutAwayListBatchResponse, ReceivingSlip, WMSWorker } from '../../types/wms.types';
import { wmsWorkerApi } from '../../utility/api/wms';

export type PutAwayGenerationMode = 'default' | 'auto' | 'manual';

interface GeneratePutAwayDialogProps {
  slip: ReceivingSlip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    slipId: string,
    options?: { mode?: 'auto' | 'manual'; workerIds?: string[] },
  ) => Promise<PutAwayList | PutAwayListBatchResponse>;
}

function workerLabel(worker: WMSWorker): string {
  const full = `${worker.first_name} ${worker.last_name}`.trim();
  const name = worker.display_name ?? (full.length > 0 ? full : null);
  if (!name) return worker.employee_id ?? worker.id;
  return worker.employee_id ? `${name} (${worker.employee_id})` : name;
}

/**
 * Fetch every assignable worker for a warehouse, following pagination so
 * warehouses with more than one page of workers are fully covered.
 */
async function fetchAllWorkers(
  accessToken: string,
  warehouseId?: string,
  pageSize = 100,
): Promise<WMSWorker[]> {
  const all: WMSWorker[] = [];
  let page = 1;
  while (page > 0) {
    const data = await wmsWorkerApi.list(accessToken, {
      page,
      page_size: pageSize,
      warehouse_id: warehouseId,
    });
    all.push(...(data.workers ?? []));
    page = data.page < data.total_pages ? page + 1 : 0;
  }
  return all;
}

function WorkerMultiSelect({
  workers,
  selected,
  onChange,
}: {
  workers: WMSWorker[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedWorkers = workers.filter((w) => selected.includes(w.id));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((w) => w !== id) : [...selected, id]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <span className={selectedWorkers.length === 0 ? 'truncate text-muted-foreground' : 'truncate'}>
            {selectedWorkers.length === 0
              ? 'No worker (unassigned)'
              : selectedWorkers.map(workerLabel).join(', ')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1" align="start">
        <label htmlFor="pa-worker-none"
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
          <Checkbox id="pa-worker-none" checked={selected.length === 0} onCheckedChange={() => onChange([])} className="mr-2" />
          No worker (unassigned)
        </label>
        {workers.map((w) => {
          const checked = selected.includes(w.id);
          return (
            <label key={w.id}
              htmlFor={`pa-worker-${w.id}`}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
              <Checkbox id={`pa-worker-${w.id}`} checked={checked} onCheckedChange={() => toggle(w.id)} className="mr-2" />
              {workerLabel(w)}
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function generationToast(
  result: PutAwayList | PutAwayListBatchResponse,
  slipNumber: string,
): { title: string; description: string } {
  const lists = 'put_away_lists' in result ? result.put_away_lists : [result];
  const warnings = lists.flatMap((l) => l.warnings ?? []);
  const summary =
    lists.length > 1
      ? `${lists.length} put-away lists created from ${slipNumber}: ${lists.map((l) => l.put_away_list_no).join(', ')}`
      : `Put-away list ${lists[0].put_away_list_no} created from ${slipNumber}`;
  return {
    title: lists.length > 1 ? 'Put-away lists generated' : 'Put-away generated',
    description: warnings.length > 0
      ? `${summary} — ${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}`
      : `${summary}.`,
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
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  const [mode, setMode] = React.useState<PutAwayGenerationMode>('default');
  const [workerIds, setWorkerIds] = React.useState<string[]>([]);
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);
  const [busy, setBusy] = React.useState(false);

  // Load all assignable workers while the dialog is open, paginating past the
  // first page so workers beyond the first 100 can still be assigned.
  React.useEffect(() => {
    if (!open || !accessToken) return;
    let cancelled = false;
    fetchAllWorkers(accessToken, slip?.warehouse_id)
      .then((data) => {
        if (!cancelled) setWorkers(data);
      })
      .catch(() => {
        if (!cancelled) setWorkers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, accessToken, slip?.warehouse_id]);

  // Reset form each time the dialog opens for a new slip.
  React.useEffect(() => {
    if (open) {
      setMode('default');
      setWorkerIds([]);
      setWorkers([]);
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Generate Put-Away List</DialogTitle>
          <DialogDescription>
            Generate a put-away list from receiving slip{' '}
            <span className="font-mono font-medium text-foreground">{slip?.slip_number ?? ''}</span>.
          </DialogDescription>
        </DialogHeader>

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
            <p className="text-xs text-muted-foreground">
              {mode === 'manual'
                ? 'Items are grouped by SKU/batch without bin assignment; workers choose bins when completing each item.'
                : mode === 'auto'
                  ? 'The server assigns bins and sorts items along the optimal walking route.'
                  : 'Uses the organisation default put-away mode (auto unless overridden in settings).'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Assign Workers (optional — select multiple to split the work)
            </p>
            <WorkerMultiSelect workers={workers} selected={workerIds} onChange={setWorkerIds} />
            <p className="text-xs text-muted-foreground">
              Selecting more than one worker splits the slip&apos;s items across separate put-away lists.
              Leave empty to keep the list unassigned.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
            <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Damaged, rejected, held, quarantined and excess lines are skipped automatically and reported as warnings.
            </span>
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
      </DialogContent>
    </Dialog>
  );
}
