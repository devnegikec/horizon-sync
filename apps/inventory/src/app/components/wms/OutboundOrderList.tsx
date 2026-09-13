import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Loader2, PackageOpen, ChevronsUpDown, X, ClipboardList, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { useToast } from '@horizon-sync/ui/hooks';

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import { useOutboundOrders } from '../../hooks/useWMS';
import type { OutboundOrder, OutboundOrderListItem, WMSWorker } from '../../types/wms.types';
import { outboundOrderApi, packingSlipApi, wmsWorkerApi } from '../../utility/api/wms';

import { createOutboundOrderColumns } from './OutboundOrderColumns';
import { WMSStatusBadge } from './WMSStatusBadge';

/** `'all'` in a filter dropdown means "no server-side filter". */
function filterParam(value: string): string | undefined {
  return value === 'all' ? undefined : value;
}

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function OutboundOrdersEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No orders found"
            description={filtered ? 'No orders match the selected filters' : 'Import an incoming order file or create an order manually.'}
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function OutboundOrdersTable({
  isInitialLoading,
  error,
  orders,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: string | null;
  orders: OutboundOrderListItem[];
  columns: ColumnDef<OutboundOrderListItem>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={8} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (orders.length === 0) {
      return <OutboundOrdersEmpty filtered={filtered} onClearFilter={onClearFilter} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={orders}
            config={{
              showSerialNumber: false,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: pageSize,
              serverPagination,
            }}
            fixedHeader
            maxHeight="auto"/>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      {renderBody()}
    </div>
  );
}

function workerLabel(worker: WMSWorker): string {
  const full = `${worker.first_name} ${worker.last_name}`.trim();
  const name = worker.display_name ?? (full.length > 0 ? full : null);
  if (!name) return worker.employee_id ?? worker.id;
  return worker.employee_id ? `${name} (${worker.employee_id})` : name;
}

async function fetchAllWorkers(accessToken: string, warehouseId?: string, pageSize = 100): Promise<WMSWorker[]> {
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

function WorkerMultiSelect({ workers, selected, onChange }: { workers: WMSWorker[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const selectedWorkers = workers.filter((w) => selected.includes(w.id));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((w) => w !== id) : [...selected, id]);
  };

  const remove = (id: string) => {
    onChange(selected.filter((w) => w !== id));
  };

  return (
    <div className="space-y-2">
      {selectedWorkers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedWorkers.map((w) => (
            <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {workerLabel(w)}
              <button type="button"
                onClick={() => remove(w.id)}
                aria-label={`Remove ${workerLabel(w)}`}
                className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button"
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <span className={selectedWorkers.length === 0 ? 'truncate text-muted-foreground' : 'truncate'}>
              {selectedWorkers.length === 0
                ? 'No worker (unassigned)'
                : `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-1" align="start">
          <label htmlFor="worker-multiselect-none"
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
            <Checkbox id="worker-multiselect-none" checked={selected.length === 0} onCheckedChange={() => onChange([])} className="mr-2" />
            No worker (unassigned)
          </label>
          {workers.map((w) => {
            const checked = selected.includes(w.id);
            return (
              <label key={w.id}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
                <Checkbox checked={checked} onCheckedChange={() => toggle(w.id)} className="mr-2" />
                {workerLabel(w)}
              </label>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function GeneratePickListsDialog({
  order,
  onClose,
  onGenerated,
}: {
  order: OutboundOrderListItem | null;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [mode, setMode] = React.useState<'default' | 'auto' | 'manual'>('default');
  const [workerIds, setWorkerIds] = React.useState<string[]>([]);
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!order || !accessToken) return;
    let cancelled = false;
    fetchAllWorkers(accessToken, order.warehouse_id)
      .then((data) => {
        if (!cancelled) setWorkers(data);
      })
      .catch(() => {
        if (!cancelled) setWorkers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [order, accessToken]);

  React.useEffect(() => {
    if (order) {
      setMode('default');
      setWorkerIds([]);
      setWorkers([]);
    }
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

function OrderDetailDialog({ order, onClose }: { order: OutboundOrder | null; onClose: () => void }) {
  if (!order) return null;

  const inStock = order.items.filter((i) => i.stock_status === 'in_stock').length;
  const outOfStock = order.items.length - inStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl border w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Order — {order.order_no}</h2>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <p className="font-medium uppercase">{order.order_type}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <WMSStatusBadge status={order.status} />
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Invoice Ref</p>
            <p className="font-medium font-mono text-sm">{order.invoice_reference ?? '—'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Stock</p>
            <p className="text-sm">
              <span className="text-green-600 font-medium">{inStock} in stock</span>
              <span className="text-muted-foreground"> / </span>
              <span className={outOfStock > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>{outOfStock} out</span>
            </p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Available</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-xs">
                    No items
                  </td>
                </tr>
              )}
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-mono text-xs">{item.sku ?? '—'}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.item_name ?? ''}</td>
                  <td className="px-4 py-2 text-right">{item.qty}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{item.available_qty ?? '—'}</td>
                  <td className="px-4 py-2">
                    <WMSStatusBadge status={item.stock_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OutboundOrderListProps {
  warehouseId?: string;
  onPickListsGenerated?: () => void;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

export function OutboundOrderList({ warehouseId, onPickListsGenerated, refreshKey }: OutboundOrderListProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [viewOrder, setViewOrder] = React.useState<OutboundOrder | null>(null);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [generateOrder, setGenerateOrder] = React.useState<OutboundOrderListItem | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [packingId, setPackingId] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useOutboundOrders({
    status: filterParam(statusFilter),
    order_type: filterParam(typeFilter),
    warehouse_id: warehouseId,
    page,
    page_size: pageSize,
  });

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  useRefreshOnKey(refreshKey, refetch);

  const handleConfirm = async (order: OutboundOrderListItem) => {
    if (!accessToken) return;
    setConfirmingId(order.id);
    try {
      await outboundOrderApi.confirmOrder(accessToken, order.id);
      toast({ title: 'Order confirmed', description: `${order.order_no} is now confirmed` });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to confirm order',
        variant: 'destructive',
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const handlePack = async (order: OutboundOrderListItem) => {
    if (!accessToken) return;
    setPackingId(order.id);
    try {
      await packingSlipApi.createFromOrders(accessToken, [order.id]);
      toast({ title: 'Packing slip created', description: `Packing slip created for ${order.order_no}` });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to pack order',
        variant: 'destructive',
      });
    } finally {
      setPackingId(null);
    }
  };

  const handleView = async (order: OutboundOrderListItem) => {
    if (!accessToken) return;
    setViewLoading(true);
    try {
      const detail = await outboundOrderApi.getOrder(accessToken, order.id);
      setViewOrder(detail);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load order detail',
        variant: 'destructive',
      });
    } finally {
      setViewLoading(false);
    }
  };

  const orders: OutboundOrderListItem[] = data?.orders ?? [];
  const pagination = data?.pagination;
  const isInitialLoading = loading && !data;

  const serverPagination = React.useMemo(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          setPage(1);
          return;
        }
        setPage(nextPage);
      },
    };
  }, [pagination]);

  const columns = createOutboundOrderColumns({
    confirmingId,
    packingId,
    viewLoading,
    onConfirm: handleConfirm,
    onPack: handlePack,
    onCreatePickList: setGenerateOrder,
    onView: handleView,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending_picking">Pending Picking</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sap">SAP</SelectItem>
            <SelectItem value="asn">ASN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        Orders are imported from incoming order files (packing slip PDF/CSV) or created manually. Flow: <span className="font-medium">Confirm</span> →{' '}
        <span className="font-medium">Create Pick List</span> → pick items → order becomes <span className="font-medium">Completed</span> →{' '}
        <span className="font-medium">Pack</span> (creates a packing slip) → Packing Slips tab → <span className="font-medium">Mark Loading</span> →{' '}
        <span className="font-medium">Dispatch</span>.
      </p>

      <OutboundOrdersTable isInitialLoading={isInitialLoading}
        error={error}
        orders={orders}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all' || typeFilter !== 'all'}
        onClearFilter={() => {
          setStatusFilter('all');
          setTypeFilter('all');
          setPage(1);
        }}/>

      <OrderDetailDialog order={viewOrder} onClose={() => setViewOrder(null)} />
      <GeneratePickListsDialog order={generateOrder}
        onClose={() => setGenerateOrder(null)}
        onGenerated={() => {
          refetch();
          onPickListsGenerated?.();
        }}/>
    </div>
  );
}
