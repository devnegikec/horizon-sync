import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, PackageCheck } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { DetailDialog } from '@horizon-sync/ui/components/ui/detail-dialog';
import { useToast } from '@horizon-sync/ui/hooks';

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import { useInvalidateOutboundOrders } from '../../hooks/useWMS';
import type { PackingSlip, PackingSlipGroup, PackingSlipListItem, PaginatedPackingSlips } from '../../types/wms.types';
import { packingSlipApi } from '../../utility/api/wms';

import { createPackingSlipColumns } from './PackingSlipColumns';
import { WMSStatusBadge } from './WMSStatusBadge';

interface PackingSlipListProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function PackingSlipsEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageCheck className="h-12 w-12" />}
            title="No packing slips found"
            description={filtered ? 'No packing slips match the selected status' : 'Packing slips are created when a completed order is packed.'}
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filter
                </Button>
              ) : undefined
            } />
        </div>
      </CardContent>
    </Card>
  );
}

function PackingSlipsTable({
  isInitialLoading,
  slips,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  slips: PackingSlipListItem[];
  columns: ColumnDef<PackingSlipListItem>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  if (isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={6} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (slips.length === 0) {
    return <PackingSlipsEmpty filtered={filtered} onClearFilter={onClearFilter} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={slips}
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
          maxHeight="auto" />
      </CardContent>
    </Card>
  );
}

function ExpandChevron({ expanded }: { expanded: boolean }) {
  const Icon = expanded ? ChevronDown : ChevronRight;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function PackingSlipGroupRow({ group }: { group: PackingSlipGroup }) {
  const [expanded, setExpanded] = React.useState(false);
  const first = group.items[0];
  const totalQty = group.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const batches = Array.from(new Set(group.items.map((item) => item.batch_number ?? '').filter(Boolean)));
  const binPath = group.bin_location_path || group.bin_location_id;

  return (
    <>
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            <ExpandChevron expanded={expanded} />
            <span className="font-mono font-medium">{first?.sku ?? '—'}</span>
            {group.product_name && <span className="text-xs text-muted-foreground ml-2">{group.product_name}</span>}
            {group.parent_qseal && (
              <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
                {group.parent_qseal.serial_number} ({group.parent_qseal.capacity})
              </span>
            )}
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
          {batches.length === 0 ? '—' : batches.join(', ')}
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
          {binPath ? (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">{binPath}</span>
          ) : (
            '—'
          )}
        </td>
        <td className="px-4 py-2 text-right">{totalQty}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">{first?.uom ?? '—'}</td>
      </tr>
      {expanded &&
        group.items.map((item, idx) => (
          <tr key={`${item.serial_number}-${idx}`} className="bg-muted/20">
            <td className="px-4 py-1.5 pl-10">
              <span className="font-mono text-xs font-medium">S.N: {item.serial_number}</span>
            </td>
            <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={4}>
              <span className="inline-flex gap-3 flex-wrap items-center">
                <span>
                  SKU: <span className="font-mono">{item.sku}</span>
                </span>
                {item.manufacturing_date && <span>Mfg: {new Date(item.manufacturing_date).toLocaleDateString()}</span>}
                {item.expiry_date && <span>Exp: {new Date(item.expiry_date).toLocaleDateString()}</span>}
                {binPath && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono">
                    Bin: {binPath}
                  </span>
                )}
              </span>
            </td>
          </tr>
        ))}
    </>
  );
}

function PackingSlipLineItemsTable({ slip }: { slip: PackingSlip }) {
  const groups = slip.groups && slip.groups.length > 0 ? slip.groups : null;
  const totalUnits = packingSlipUnits(slip);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Line Items ({groups ? `${groups.length} groups · ` : ''}{totalUnits} units)
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Location Bin</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">UOM</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {groups ? (
            groups.map((group, groupIndex) => (
              <PackingSlipGroupRow key={`${group.parent_qseal?.id ?? 'unpacked'}-${groupIndex}`} group={group} />
            ))
          ) : (slip.items ?? []).length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-xs">
                No items
              </td>
            </tr>
          ) : (
            (slip.items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2">
                  <span className="font-mono font-medium">{item.sku ?? item.item_id ?? '—'}</span>
                  {item.item_name && <span className="text-xs text-muted-foreground ml-2">{item.item_name}</span>}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.batch_no ?? '—'}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {item.bin_location_id ? item.bin_location_id.slice(0, 8) : '—'}
                </td>
                <td className="px-4 py-2 text-right">{item.qty}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">{item.uom}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Total packed units across a packing slip, summed from grouped quantities. */
function packingSlipUnits(slip: PackingSlip | null): number {
  if (!slip) return 0;
  if (slip.groups && slip.groups.length > 0) {
    return slip.groups.reduce(
      (sum, group) => sum + group.items.reduce((s, item) => s + (item.quantity || 0), 0),
      0,
    );
  }
  return (slip.items ?? []).reduce((sum, item) => sum + (item.qty || 0), 0);
}

export function PackingSlipList({ warehouseId, refreshKey }: PackingSlipListProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const invalidateOrders = useInvalidateOutboundOrders();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [data, setData] = React.useState<PaginatedPackingSlips | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewSlip, setViewSlip] = React.useState<PackingSlip | null>(null);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const fetchRequestId = React.useRef(0);
  const detailRequestId = React.useRef(0);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    const requestId = ++fetchRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await packingSlipApi.list(accessToken, {
        warehouse_id: warehouseId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: pageSize,
      });
      if (requestId !== fetchRequestId.current) return;
      setData(result);
    } catch (err) {
      if (requestId !== fetchRequestId.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load packing slips');
    } finally {
      if (requestId === fetchRequestId.current) {
        setLoading(false);
      }
    }
  }, [accessToken, warehouseId, statusFilter, page, pageSize]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  useRefreshOnKey(refreshKey, fetch);

  const openDetail = async (id: string) => {
    if (!accessToken) return;
    const requestId = ++detailRequestId.current;
    setViewLoading(true);
    try {
      const slip = await packingSlipApi.get(accessToken, id);
      if (requestId !== detailRequestId.current) return;
      setViewSlip(slip);
    } catch (err) {
      if (requestId !== detailRequestId.current) return;
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load packing slip',
        variant: 'destructive',
      });
    } finally {
      if (requestId === detailRequestId.current) {
        setViewLoading(false);
      }
    }
  };

  const markLoading = async (id: string) => {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await packingSlipApi.markLoading(accessToken, id);
      toast({ title: 'Packing slip moved to loading' });
      fetch();
      setViewSlip(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const dispatch = async (id: string) => {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await packingSlipApi.dispatch(accessToken, id);
      toast({ title: 'Packing slip dispatched' });
      // Dispatching completes the order, so the Orders tab is now stale.
      invalidateOrders();
      fetch();
      setViewSlip(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to dispatch',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const slips = data?.packing_slips ?? [];
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

  const columns = createPackingSlipColumns({
    busyId,
    onView: (slip) => openDetail(slip.id),
    onMarkLoading: (slip) => markLoading(slip.id),
    onDispatch: (slip) => dispatch(slip.id),
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
            <SelectItem value="loading">Loading</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <PackingSlipsTable isInitialLoading={isInitialLoading}
        slips={slips}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all'}
        onClearFilter={() => {
          setStatusFilter('all');
          setPage(1);
        }} />

      <DetailDialog open={viewSlip !== null}
        onOpenChange={(o) => {
          if (!o) setViewSlip(null);
        }}
        title={viewSlip ? `Packing — ${viewSlip.packing_slip_no}` : 'Loading...'}
        size="lg"
        loading={viewLoading}
        loadingMessage="Loading packing slip...">
        {viewSlip && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <WMSStatusBadge status={viewSlip.status} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                <p className="font-semibold">{viewSlip.order_ids.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Units</p>
                <p className="font-semibold">{packingSlipUnits(viewSlip)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Invoice Ref</p>
                {viewSlip.invoice_reference && viewSlip.invoice_reference.length > 0 ? (
                  <div className="space-y-0.5">
                    {viewSlip.invoice_reference.map((ref) => (
                      <p key={ref} className="font-mono text-xs">{ref}</p>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>

            <PackingSlipLineItemsTable slip={viewSlip} />

            <p className="text-xs text-muted-foreground">
              Created: {viewSlip.created_at ? new Date(viewSlip.created_at).toLocaleString() : '—'}
            </p>
          </div>
        )}
      </DetailDialog>
    </div>
  );
}
