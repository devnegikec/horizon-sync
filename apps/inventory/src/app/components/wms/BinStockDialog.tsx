import * as React from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { DetailDialog } from '@horizon-sync/ui/components';

import type { BinStockParent, BinStockParentChild, BinStockParentsResponse, LocationTree } from '../../types/wms.types';
import { binStockApi } from '../../utility/api/wms';

interface BinStockDialogProps {
  bin: LocationTree | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BinStockChildRow({ child }: { child: BinStockParentChild }) {
  return (
    <tr className="bg-muted/20">
      <td className="px-4 py-1.5 pl-10">
        <span className="font-mono text-xs font-medium">{child.serial_number}</span>
      </td>
      <td className="px-4 py-1.5 font-mono text-xs text-muted-foreground">{child.batch_number ?? '—'}</td>
      <td className="px-4 py-1.5" colSpan={2}>
        <span className="inline-flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {child.inventory_status}
          </span>
          {child.manufacturing_date && <span>Mfg: {new Date(child.manufacturing_date).toLocaleDateString()}</span>}
          {child.expiry_date && <span>Exp: {new Date(child.expiry_date).toLocaleDateString()}</span>}
          {child.dispatch_batch && <span>Dispatch: <span className="font-mono">{child.dispatch_batch}</span></span>}
        </span>
      </td>
      <td className="px-4 py-1.5 text-right tabular-nums">{Number(child.quantity_on_hand).toLocaleString()}</td>
    </tr>
  );
}

function BinStockParentRow({ parent }: { parent: BinStockParent }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="font-medium">{parent.parent_name}</span>
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{parent.parent_serial}</td>
        <td className="px-4 py-2 text-center tabular-nums">{parent.capacity}</td>
        <td className="px-4 py-2 text-center tabular-nums">{parent.child_units_in_bin}</td>
        <td className="px-4 py-2 text-right tabular-nums font-medium">{Number(parent.quantity_on_hand).toLocaleString()}</td>
      </tr>
      {expanded && parent.children.map((child, idx) => (
        <BinStockChildRow key={`${parent.parent_id}-${idx}`} child={child} />
      ))}
    </>
  );
}

function BinStockParentsTable({ parents }: { parents: BinStockParent[] }) {
  if (parents.length === 0) {
    return <p className="px-4 py-6 text-center text-muted-foreground text-xs">No stock in this bin.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/30">
        <tr>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Box</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Serial</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Capacity</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Units</th>
          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty On Hand</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {parents.map((parent) => (
          <BinStockParentRow key={parent.parent_id} parent={parent} />
        ))}
      </tbody>
    </table>
  );
}

export function BinStockDialog({ bin, open, onOpenChange }: BinStockDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<BinStockParentsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !bin || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    binStockApi
      .getParents(accessToken, bin.id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load bin stock');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bin, accessToken]);

  const parents = data?.parents ?? [];
  const totalOnHand = parents.reduce((sum, parent) => sum + (Number(parent.quantity_on_hand) || 0), 0);

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      title={bin ? `Bin Stock — ${bin.code}` : 'Bin Stock'}
      size="lg"
      loading={loading}
      loadingMessage="Loading bin stock...">
      {bin && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stock in <span className="font-mono font-medium text-foreground">{bin.code}</span>
            {bin.full_path ? ` · ${bin.full_path}` : ''}
          </p>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  Parent boxes: <span className="font-semibold text-foreground tabular-nums">{data?.total_parent_boxes ?? 0}</span>
                </span>
                <span className="text-muted-foreground">
                  Total on hand: <span className="font-semibold text-foreground tabular-nums">{totalOnHand.toLocaleString()}</span>
                </span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <BinStockParentsTable parents={parents} />
              </div>
            </>
          )}
        </div>
      )}
    </DetailDialog>
  );
}
