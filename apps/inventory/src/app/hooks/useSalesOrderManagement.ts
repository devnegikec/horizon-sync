import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { salesOrderApi } from '../utility/api/sales-orders';
import { stockLevelApi } from '../utility/api/stock';
import { warehouseApi } from '../utility/api/warehouses';
import type {
  SalesOrder,
  SalesOrderCreate,
  SalesOrderUpdate,
  SalesOrderListResponse,
  ConvertToInvoiceRequest,
  ConvertToInvoiceResponse,
  ConvertToDeliveryNoteResponse,
} from '../types/sales-order.types';
import type { StockLevelsResponse, StockLevel } from '../types/stock.types';
import type { WarehousesResponse } from '../types/warehouse.types';

export interface SalesOrderFilters {
  search: string;
  status: string;
}

const salesOrdersQueryKey = ['sales-orders'] as const;

function useSalesOrders(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const memoizedFilters = React.useMemo(
    () => filters,
    [filters?.search, filters?.status]
  );

  const queryKey = React.useMemo(
    () => [
      ...salesOrdersQueryKey,
      initialPage,
      initialPageSize,
      memoizedFilters?.status ?? 'all',
      memoizedFilters?.search ?? '',
    ] as const,
    [initialPage, initialPageSize, memoizedFilters?.status, memoizedFilters?.search]
  );

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!accessToken) return { sales_orders: [], pagination: null };
      const data = await salesOrderApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          search: memoizedFilters?.search || undefined,
        }
      ) as SalesOrderListResponse;
      return data;
    },
    enabled: !!accessToken,
  });

  const salesOrders = (data?.sales_orders ?? []) as unknown as SalesOrder[];
  const pagination = data?.pagination ?? null;
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load sales orders') : null;

  return { salesOrders, pagination, loading, error, refetch };
}

/**
 * Update stock levels when a sales order is confirmed or cancelled.
 * - confirm: increase quantity_reserved, decrease quantity_available
 * - cancel: decrease quantity_reserved, increase quantity_available
 */
async function updateStockLevelsForOrder(
  accessToken: string,
  salesOrder: SalesOrder,
  action: 'confirm' | 'cancel',
) {
  // Find the default warehouse
  const warehousesData = await warehouseApi.list(accessToken, 1, 100) as WarehousesResponse;
  const defaultWarehouse = warehousesData.warehouses?.find((w) => w.is_default);
  if (!defaultWarehouse) {
    console.warn('No default warehouse found — skipping stock level update');
    return;
  }

  const warehouseId = defaultWarehouse.id;

  for (const item of salesOrder.items) {
    const qty = Number(item.qty);
    if (qty <= 0) continue;

    try {
      // Fetch current stock level for this item + warehouse
      const stockData = await stockLevelApi.getByLocation(
        accessToken,
        item.item_id,
        warehouseId,
      ) as StockLevelsResponse;

      const currentStock: StockLevel | undefined = stockData.stock_levels?.[0];
      if (!currentStock) {
        console.warn(`No stock level found for item ${item.item_id} in warehouse ${warehouseId}`);
        continue;
      }

      const onHand = Number(currentStock.quantity_on_hand);
      let reserved = Number(currentStock.quantity_reserved);
      let available = Number(currentStock.quantity_available);

      if (action === 'confirm') {
        reserved += qty;
        available -= qty;
      } else {
        // cancel — reverse the reservation
        reserved = Math.max(0, reserved - qty);
        available += qty;
      }

      await stockLevelApi.updateByLocation(accessToken, item.item_id, warehouseId, {
        quantity_on_hand: onHand,
        quantity_reserved: reserved,
        quantity_available: available,
      });
    } catch (err) {
      console.error(`Failed to update stock for item ${item.item_id}:`, err);
    }
  }
}

export function useSalesOrderManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<SalesOrderFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = React.useState(false);
  const [deliveryNoteDialogOpen, setDeliveryNoteDialogOpen] = React.useState(false);
  const [selectedSalesOrder, setSelectedSalesOrder] = React.useState<SalesOrder | null>(null);
  const [editSalesOrder, setEditSalesOrder] = React.useState<SalesOrder | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<SalesOrder> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { salesOrders, pagination, loading, error, refetch } = useSalesOrders(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const confirmed = salesOrders.filter((so) => so.status === 'confirmed').length;
    const confirmedValue = salesOrders
      .filter((so) => so.status === 'confirmed')
      .reduce((sum, so) => sum + Number(so.grand_total), 0);
    const pendingDelivery = salesOrders.filter(
      (so) => so.status === 'confirmed' || so.status === 'partially_delivered'
    ).length;
    return { total, confirmed, confirmedValue, pendingDelivery };
  }, [salesOrders, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesOrderApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Sales order deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete sales order',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(async (salesOrder: SalesOrder) => {
    if (!accessToken) return;
    try {
      // Fetch full sales order details including line items
      const fullSalesOrder = await salesOrderApi.get(accessToken, salesOrder.id) as SalesOrder;
      setSelectedSalesOrder(fullSalesOrder);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load sales order details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreate = React.useCallback(() => {
    setEditSalesOrder(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(async (salesOrder: SalesOrder) => {
    if (!accessToken) return;
    try {
      // Fetch full sales order details including line items
      const fullSalesOrder = await salesOrderApi.get(accessToken, salesOrder.id) as SalesOrder;
      setEditSalesOrder(fullSalesOrder);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load sales order details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleDelete = React.useCallback((salesOrder: SalesOrder) => {
    if (salesOrder.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft sales orders can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete sales order ${salesOrder.sales_order_no}?`)) {
      deleteMutation.mutate(salesOrder.id);
    }
  }, [deleteMutation, toast]);

  const handleCreateInvoice = React.useCallback(async (salesOrder: SalesOrder) => {
    if (!accessToken) return;
    try {
      // Fetch full sales order details including line items
      const fullSalesOrder = await salesOrderApi.get(accessToken, salesOrder.id) as SalesOrder;
      setSelectedSalesOrder(fullSalesOrder);
      setDetailDialogOpen(false);
      setInvoiceDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load sales order details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreateDeliveryNote = React.useCallback(async (salesOrder: SalesOrder) => {
    if (!accessToken) return;
    try {
      const fullSalesOrder = await salesOrderApi.get(accessToken, salesOrder.id) as SalesOrder;
      setSelectedSalesOrder(fullSalesOrder);
      setDetailDialogOpen(false);
      setDeliveryNoteDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load sales order details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleTableReady = React.useCallback((table: Table<SalesOrder>) => {
    setTableInstance(table);
  }, []);

  const handleSave = React.useCallback(async (data: SalesOrderCreate | SalesOrderUpdate, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        // Detect status change for stock level updates
        const previousStatus = editSalesOrder?.status;
        const newStatus = (data as SalesOrderUpdate).status;
        const statusChanged = previousStatus && newStatus && previousStatus !== newStatus;

        await salesOrderApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Sales order updated successfully' });

        // Update stock levels on status transitions
        if (statusChanged && editSalesOrder?.items) {
          const isConfirming = previousStatus === 'draft' && newStatus === 'confirmed';
          const isCancelling = newStatus === 'cancelled' && (previousStatus === 'confirmed' || previousStatus === 'partially_delivered');

          if (isConfirming || isCancelling) {
            await updateStockLevelsForOrder(accessToken, editSalesOrder, isConfirming ? 'confirm' : 'cancel');
          }
        }
      } else {
        await salesOrderApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Sales order created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save sales order',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch, editSalesOrder]);

  const handleConvertToInvoice = React.useCallback(async (salesOrderId: string, data: ConvertToInvoiceRequest) => {
    if (!accessToken) return;

    try {
      const result = await salesOrderApi.convertToInvoice(accessToken, salesOrderId, data) as ConvertToInvoiceResponse;
      toast({
        title: 'Success',
        description: result.message || 'Invoice created successfully',
      });
      setInvoiceDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create invoice',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch]);

  const handleConvertToDeliveryNote = React.useCallback(async (
    salesOrderId: string,
    data: { items: { item_id: string; qty_to_deliver: number; warehouse_id: string }[] },
  ) => {
    if (!accessToken) return;

    try {
      // Group items by warehouse — create one delivery note per warehouse
      const warehouseMap = new Map<string, { item_id: string; qty_to_deliver: number }[]>();
      for (const item of data.items) {
        const existing = warehouseMap.get(item.warehouse_id) || [];
        existing.push({ item_id: item.item_id, qty_to_deliver: item.qty_to_deliver });
        warehouseMap.set(item.warehouse_id, existing);
      }

      const results: ConvertToDeliveryNoteResponse[] = [];
      for (const [, items] of warehouseMap) {
        const result = await salesOrderApi.convertToDeliveryNote(
          accessToken,
          salesOrderId,
          { items },
        ) as ConvertToDeliveryNoteResponse;
        results.push(result);
      }

      const noteCount = results.length;
      toast({
        title: 'Success',
        description: noteCount > 1
          ? `${noteCount} delivery notes created successfully`
          : results[0]?.message || 'Delivery note created successfully',
      });
      setDeliveryNoteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create delivery note',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch]);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1,
    pageSize: pageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    }
  }), [page, pageSize, pagination?.total_items]);

  return {
    filters,
    setFilters,
    salesOrders,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    invoiceDialogOpen,
    setInvoiceDialogOpen,
    deliveryNoteDialogOpen,
    setDeliveryNoteDialogOpen,
    selectedSalesOrder,
    setSelectedSalesOrder,
    editSalesOrder,
    setEditSalesOrder,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCreateInvoice,
    handleCreateDeliveryNote,
    handleTableReady,
    handleSave,
    handleConvertToInvoice,
    handleConvertToDeliveryNote,
    serverPaginationConfig,
  };
}
