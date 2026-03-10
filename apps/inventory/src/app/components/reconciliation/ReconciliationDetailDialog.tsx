import * as React from 'react';

import { ClipboardCheck, Loader2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { cn } from '@horizon-sync/ui/lib';

import type { StockReconciliation, StockReconciliationItem } from '../../types/stock.types';
import { formatDate } from '../../utility';
import { stockReconciliationApi } from '../../utility/api/stock';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ReconciliationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliation: StockReconciliation | null;
}

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Submitted' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

/* ------------------------------------------------------------------ */
/*  Items table                                                        */
/* ------------------------------------------------------------------ */

function ItemsTable({ items }: { items: StockReconciliationItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No adjustment items found.
      </p>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Item Code</th>
              <th className="text-left px-4 py-3 font-medium">Item Name</th>
              <th className="text-left px-4 py-3 font-medium">Warehouse</th>
              <th className="text-right px-4 py-3 font-medium">System Qty</th>
              <th className="text-right px-4 py-3 font-medium">Actual Qty</th>
              <th className="text-right px-4 py-3 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => {
              const diff = item.qty_difference ?? (item.qty - (item.current_qty ?? 0));
              return (
                <tr key={item.id ?? idx}>
                  <td className="px-4 py-3">
                    <code className="text-xs">{item.item_code ?? '—'}</code>
                  </td>
                  <td className="px-4 py-3">{item.item_name ?? item.item_id}</td>
                  <td className="px-4 py-3">{item.warehouse_name ?? item.warehouse_id}</td>
                  <td className="text-right px-4 py-3 tabular-nums">
                    {item.current_qty ?? '—'}
                  </td>
                  <td className="text-right px-4 py-3 tabular-nums">{item.qty}</td>
                  <td className={cn(
                    'text-right px-4 py-3 tabular-nums font-medium',
                    diff > 0 && 'text-emerald-600 dark:text-emerald-400',
                    diff < 0 && 'text-red-600 dark:text-red-400',
                  )}>
                    {diff > 0 ? '+' : ''}{diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dialog                                                        */
/* ------------------------------------------------------------------ */

export function ReconciliationDetailDialog({
  open,
  onOpenChange,
  reconciliation,
}: ReconciliationDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [items, setItems] = React.useState<StockReconciliationItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch full reconciliation when opened if items aren't already loaded
  React.useEffect(() => {
    if (!open || !reconciliation || !accessToken) {
      setItems([]);
      return;
    }

    if (reconciliation.items && reconciliation.items.length > 0) {
      setItems(reconciliation.items);
      return;
    }

    let cancelled = false;
    setLoading(true);
    stockReconciliationApi
      .get(accessToken, reconciliation.id)
      .then((data: any) => {
        if (!cancelled) {
          setItems(data?.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, reconciliation, accessToken]);

  if (!reconciliation) return null;

  const statusBadge = getStatusBadge(reconciliation.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5" />
            Reconciliation Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Reconciliation No</p>
              <p className="text-lg font-semibold">{reconciliation.reconciliation_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Posting Date</p>
              <p className="font-medium">{formatDate(reconciliation.posting_date, 'DD-MMM-YY')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{reconciliation.purpose ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items Count</p>
              <p className="font-medium">{reconciliation.items_count ?? items.length}</p>
            </div>
          </div>

          {reconciliation.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{reconciliation.remarks}</p>
            </div>
          )}

          <Separator />

          {/* Items table */}
          <div>
            <h3 className="text-lg font-medium mb-4">Stock Adjustment Entries</h3>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading items…</span>
              </div>
            ) : (
              <ItemsTable items={items} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
