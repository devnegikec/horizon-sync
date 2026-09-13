import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { PackageCheck } from 'lucide-react';

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
import type { PackingSlip, PackingSlipListItem, PaginatedPackingSlips } from '../../types/wms.types';
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
            }/>
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
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}

export function PackingSlipList({ warehouseId, refreshKey }: PackingSlipListProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
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
        }}/>

      <DetailDialog open={viewSlip !== null}
        onOpenChange={(o) => {
          if (!o) setViewSlip(null);
        }}
        title={viewSlip ? `Packing — ${viewSlip.packing_slip_no}` : 'Loading...'}
        size="lg"
        loading={viewLoading}
        loadingMessage="Loading packing slip...">
        {viewSlip && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <WMSStatusBadge status={viewSlip.status} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Orders</p>
                <p className="font-semibold">{viewSlip.order_ids.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Items</p>
                <p className="font-semibold">{viewSlip.items.length}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Bin</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewSlip.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-xs">
                        No items
                      </td>
                    </tr>
                  )}
                  {viewSlip.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <span className="font-mono font-medium">{item.sku ?? item.item_id}</span>
                        {item.item_name && <span className="text-xs text-muted-foreground ml-2">{item.item_name}</span>}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.batch_no ?? '—'}</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {item.bin_location_id ? item.bin_location_id.slice(0, 8) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DetailDialog>
    </div>
  );
}
