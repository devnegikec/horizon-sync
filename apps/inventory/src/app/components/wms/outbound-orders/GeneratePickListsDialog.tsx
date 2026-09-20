import * as React from 'react';

import { ChevronsUpDown, ClipboardList, Loader2, PackageOpen, TriangleAlert, X } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
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
import { useToast } from '@horizon-sync/ui/hooks';

import { useInvalidateOutboundOrders, useWarehouseWorkers } from '../../../hooks/useWMS';
import type { OutboundOrderListItem } from '../../../types/wms.types';
import { outboundOrderApi } from '../../../utility/api/wms';
import { WorkerMultiSelect } from '../WorkerMultiSelect';


export interface GeneratePickListsDialogProps {
  /** Order to split into pick lists. `null` closes the dialog. */
  order: OutboundOrderListItem | null;
  onClose: () => void;
  onGenerated: () => void;
}

export function GeneratePickListsDialog({ order, onClose, onGenerated }: GeneratePickListsDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const invalidateOrders = useInvalidateOutboundOrders();
  const [mode, setMode] = React.useState<'default' | 'auto' | 'manual'>('default');
  const [workerIds, setWorkerIds] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  // Every assignable worker of the order's warehouse, loaded while the dialog is open.
  const { workers } = useWarehouseWorkers(order?.warehouse_id, Boolean(order));

  React.useEffect(() => {
    if (!order) return;
    setMode('default');
    setWorkerIds([]);
  }, [order]);

  if (!order) return null;

  const handleGenerate = async () => {
    if (!accessToken) return;
    setBusy(true);
    try {
      const lists = await outboundOrderApi.generatePickLists(accessToken, order.id, {
        mode: mode === 'default' ? undefined : mode,
        worker_ids: workerIds,
      });
      const summary =
        lists.length > 1
          ? `${lists.length} pick lists created: ${lists.map((l) => l.pick_list_no).join(', ')}`
          : `Pick list ${lists[0]?.pick_list_no ?? ''} created`;
      toast({ title: 'Pick lists generated', description: summary });
      // Generating a pick list moves the order to pending picking.
      invalidateOrders();
      onClose();
      onGenerated();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate pick lists',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Generate Pick Lists
        </h2>
        <p className="text-sm text-muted-foreground">
          Create pick lists from order <span className="font-mono font-medium text-foreground">{order.order_no}</span> (
          {order.order_type.toUpperCase()}).
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Generation Mode</p>
          <Select value={mode} onValueChange={(v) => setMode(v as 'default' | 'auto' | 'manual')}>
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
              ? 'Items are grouped by SKU without bin assignment; workers choose bins when picking each item.'
              : mode === 'auto'
                ? 'The server assigns bin locations (FIFO/FEFO) and sorts items along the optimal walking route.'
                : 'Uses the organisation default pick mode (auto unless overridden in settings).'}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Assign Workers (optional — select multiple to split the work)</p>
          <WorkerMultiSelect workers={workers} selected={workerIds} onChange={setWorkerIds} />
          <p className="text-xs text-muted-foreground">
            Selecting more than one worker splits the order lines across separate pick lists. Leave empty to create a single unassigned pick list.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
          <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Items flagged Out of Stock may short-pick during fulfillment and are recorded as pick exceptions.</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => handleGenerate()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PackageOpen className="h-4 w-4 mr-1" />}
            Create Pick List
          </Button>
        </div>
      </div>
    </div>
  );
}
