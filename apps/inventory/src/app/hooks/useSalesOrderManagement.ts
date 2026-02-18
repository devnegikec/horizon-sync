import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { salesOrderApi } from '../utility/api/sales-orders';
import type {
  SalesOrder,
  SalesOrderCreate,
  SalesOrderUpdate,
  SalesOrderListResponse,
  ConvertToInvoiceRequest,
  ConvertToInvoiceResponse,
} from '../types/sales-order.types';

export interface SalesOrderFilters {
  search: string;
  status: string;
}

function useSalesOrders(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [salesOrders, setSalesOrders] = React.useState<SalesOrder[]>([]);
  const [pagination, setPagination] = React.useState<{
    total_items: number;
    total_pages: number;
    page: number;
    page_size: number;
    has_next: boolean;
    has_prev: boolean;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const memoizedFilters = React.useMemo(
    () => filters,
    [filters?.search, filters?.status]
  );

  const fetchSalesOrders = React.useCallback(async () => {
    if (!accessToken) {
      setSalesOrders([]);
      setPagination(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await salesOrderApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          search: memoizedFilters?.search || undefined,
        }
      ) as SalesOrderListResponse;
      setSalesOrders((data.sales_orders ?? []) as unknown as SalesOrder[]);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales orders');
      setSalesOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);

  return { salesOrders, pagination, loading, error, refetch: fetchSalesOrders };
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

  const handleTableReady = React.useCallback((table: Table<SalesOrder>) => {
    setTableInstance(table);
  }, []);

  const handleSave = React.useCallback(async (data: SalesOrderCreate | SalesOrderUpdate, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        await salesOrderApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Sales order updated successfully' });
      } else {
        await salesOrderApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Sales order created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
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
  }, [accessToken, toast, queryClient, refetch]);

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
    handleTableReady,
    handleSave,
    handleConvertToInvoice,
    serverPaginationConfig,
  };
}
