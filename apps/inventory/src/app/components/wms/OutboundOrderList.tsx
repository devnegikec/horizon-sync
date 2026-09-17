import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks';

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import { useInvalidateOutboundOrders, useOutboundOrder, useOutboundOrders } from '../../hooks/useWMS';
import type { OutboundOrderCountsState, OutboundOrderListItem } from '../../types/wms.types';
import { outboundOrderApi, packingSlipApi } from '../../utility/api/wms';

import {
  createOutboundOrderColumns,
  GeneratePickListsDialog,
  OrderDetailDialog,
  OutboundOrderFilters,
  OutboundOrdersTable,
} from './outbound-orders';

/** `'all'` in a filter dropdown means "no server-side filter". */
function filterParam(value: string): string | undefined {
  return value === 'all' ? undefined : value;
}

interface OutboundOrderListProps {
  warehouseId?: string;
  onPickListsGenerated?: () => void;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
  /**
   * Publishes the list's status counts (tagged with the warehouse they belong
   * to) so sibling stat cards can reuse them instead of issuing a second
   * request to the same endpoint.
   */
  onStatusCountsChange?: (state: OutboundOrderCountsState) => void;
}

export function OutboundOrderList({ warehouseId, onPickListsGenerated, refreshKey, onStatusCountsChange }: OutboundOrderListProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);
  const [generateOrder, setGenerateOrder] = React.useState<OutboundOrderListItem | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [packingId, setPackingId] = React.useState<string | null>(null);

  const { data, statusCounts, loading, isPlaceholderData, error, refetch } = useOutboundOrders({
    status: filterParam(statusFilter),
    order_type: filterParam(typeFilter),
    warehouse_id: warehouseId,
    page,
    page_size: pageSize,
  });

  // Cached detail for the open dialog. Confirm/pack invalidate the outbound-orders
  // prefix, so this refreshes alongside the list.
  const { order: viewOrder, loading: viewLoading, error: viewError } = useOutboundOrder(viewOrderId);

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  useRefreshOnKey(refreshKey, refetch);

  // Share the counts returned with the list so the stat cards above don't need
  // their own request to the same endpoint. `warehouseId` tags the counts so the
  // cards can drop them when the warehouse selection changes.
  //
  // `keepPreviousData` keeps the previous request's counts visible while the next
  // one loads. When the warehouse changes those counts belong to the old
  // warehouse, so tagging them with the new id would show the wrong totals —
  // withhold them until the response matches the current selection.
  React.useEffect(() => {
    onStatusCountsChange?.({
      warehouseId,
      counts: isPlaceholderData ? null : statusCounts,
      loading,
    });
  }, [warehouseId, statusCounts, loading, isPlaceholderData, onStatusCountsChange]);

  const invalidateOrders = useInvalidateOutboundOrders();

  const handleConfirm = React.useCallback(async (order: OutboundOrderListItem) => {
    if (!accessToken) return;
    setConfirmingId(order.id);
    try {
      await outboundOrderApi.confirmOrder(accessToken, order.id);
      toast({ title: 'Order confirmed', description: `${order.order_no} is now confirmed` });
      invalidateOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to confirm order',
        variant: 'destructive',
      });
    } finally {
      setConfirmingId(null);
    }
  }, [accessToken, toast, invalidateOrders]);

  const handlePack = React.useCallback(async (order: OutboundOrderListItem) => {
    if (!accessToken) return;
    setPackingId(order.id);
    try {
      await packingSlipApi.createFromOrders(accessToken, [order.id]);
      toast({ title: 'Packing slip created', description: `Packing slip created for ${order.order_no}` });
      invalidateOrders();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to pack order',
        variant: 'destructive',
      });
    } finally {
      setPackingId(null);
    }
  }, [accessToken, toast, invalidateOrders]);

  const handleView = React.useCallback((order: OutboundOrderListItem) => {
    setViewOrderId(order.id);
  }, []);

  const handleDetailOpenChange = React.useCallback((open: boolean) => {
    if (!open) setViewOrderId(null);
  }, []);

  const handleStatusFilterChange = React.useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleTypeFilterChange = React.useCallback((value: string) => {
    setTypeFilter(value);
    setPage(1);
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPage(1);
  }, []);

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

  const columns = React.useMemo(
    () =>
      createOutboundOrderColumns({
        confirmingId,
        packingId,
        viewLoading,
        onConfirm: handleConfirm,
        onPack: handlePack,
        onCreatePickList: setGenerateOrder,
        onView: handleView,
      }),
    [confirmingId, packingId, viewLoading, handleConfirm, handlePack, handleView],
  );

  return (
    <div className="space-y-4">
      <OutboundOrderFilters statusFilter={statusFilter}
        typeFilter={typeFilter}
        statusCounts={statusCounts}
        onStatusFilterChange={handleStatusFilterChange}
        onTypeFilterChange={handleTypeFilterChange}/>

      <OutboundOrdersTable isInitialLoading={isInitialLoading}
        error={error}
        orders={orders}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all' || typeFilter !== 'all'}
        onClearFilter={handleClearFilters}/>

      <OrderDetailDialog order={viewOrder}
        loading={viewLoading}
        error={viewError}
        open={viewOrderId !== null}
        onOpenChange={handleDetailOpenChange}/>
      <GeneratePickListsDialog order={generateOrder}
        onClose={() => setGenerateOrder(null)}
        onGenerated={() => {
          invalidateOrders();
          onPickListsGenerated?.();
        }}/>
    </div>
  );
}
