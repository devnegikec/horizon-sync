import * as React from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type {
  AsnOrder,
  AsnOrderCreate,
  AsnOrderUpdate,
  AsnOrderListResponse,
} from '../types/asn-order.types';
import { asnOrderApi } from '../utility/api/asn-orders';
import { getFriendlyErrorMessage } from '../utility/api/core';

export interface AsnOrderFilters {
  search: string;
  status: string;
  warehouse_id: string;
  source_warehouse_id: string;
  delivery_date_from: string;
  delivery_date_to: string;
  vehicle_no: string;
  asn_type: string;
}

const asnOrdersQueryKey = ['asn-orders'] as const;

function useAsnOrders(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string; warehouse_id?: string; source_warehouse_id?: string; delivery_date_from?: string; delivery_date_to?: string; vehicle_no?: string; asn_type?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const memoizedFilters = React.useMemo(
    () => filters,
    [filters?.search, filters?.status, filters?.warehouse_id, filters?.source_warehouse_id, filters?.delivery_date_from, filters?.delivery_date_to, filters?.vehicle_no, filters?.asn_type]
  );

  const queryKey = React.useMemo(
    () => [
      ...asnOrdersQueryKey,
      initialPage,
      initialPageSize,
      memoizedFilters?.status ?? 'all',
      memoizedFilters?.warehouse_id ?? 'all',
      memoizedFilters?.source_warehouse_id ?? 'all',
      memoizedFilters?.delivery_date_from ?? 'all',
      memoizedFilters?.delivery_date_to ?? 'all',
      memoizedFilters?.vehicle_no ?? 'all',
      memoizedFilters?.asn_type ?? 'all',
      memoizedFilters?.search ?? '',
    ] as const,
    [initialPage, initialPageSize, memoizedFilters?.status, memoizedFilters?.warehouse_id, memoizedFilters?.source_warehouse_id, memoizedFilters?.delivery_date_from, memoizedFilters?.delivery_date_to, memoizedFilters?.vehicle_no, memoizedFilters?.asn_type, memoizedFilters?.search]
  );

  const {
    data,
    isFetching: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!accessToken) return { asn_orders: [], pagination: null };
      const data = await asnOrderApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          warehouse_id: memoizedFilters?.warehouse_id || undefined,
          source_warehouse_id: memoizedFilters?.source_warehouse_id || undefined,
          delivery_date_from: memoizedFilters?.delivery_date_from || undefined,
          delivery_date_to: memoizedFilters?.delivery_date_to || undefined,
          vehicle_no: memoizedFilters?.vehicle_no || undefined,
          search: memoizedFilters?.search || undefined,
          asn_type: memoizedFilters?.asn_type || undefined,
        }
      ) as AsnOrderListResponse;
      return data;
    },
    enabled: !!accessToken,
  });

  const asnOrders = (data?.asn_orders ?? []) as unknown as AsnOrder[];
  const pagination = data?.pagination ?? null;
  const error = queryError ? getFriendlyErrorMessage(queryError) : null;

  return { asnOrders, pagination, loading, error, refetch };
}

export function useAsnOrderManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<AsnOrderFilters>({
    search: '',
    status: 'all',
    warehouse_id: '',
    source_warehouse_id: '',
    delivery_date_from: '',
    delivery_date_to: '',
    vehicle_no: '',
    asn_type: '',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [saving, setSaving] = React.useState(false);
  const [recentlyCreatedId, setRecentlyCreatedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const { asnOrders, pagination, loading, error, refetch } = useAsnOrders(page, pageSize, filters);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => asnOrderApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'ASN order deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['asn-orders'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: getFriendlyErrorMessage(err),
        variant: 'destructive',
      });
    },
  });

  const clearRecentlyCreatedRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = React.useCallback(async (data: AsnOrderCreate | AsnOrderUpdate, id?: string) => {
    if (!accessToken) return;

    setSaving(true);
    try {
      if (id) {
        await asnOrderApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'ASN order updated successfully' });
      } else {
        const created = await asnOrderApi.create(accessToken, data) as { id?: string; asn_order_no?: string };
        toast({ title: 'Success', description: `ASN order ${created?.asn_order_no || 'created'} successfully` });
        if (created?.id) {
          setRecentlyCreatedId(created.id);
          if (clearRecentlyCreatedRef.current) clearTimeout(clearRecentlyCreatedRef.current);
          clearRecentlyCreatedRef.current = setTimeout(() => setRecentlyCreatedId(null), 10000);
        }
        setPage(1);
      }
      queryClient.invalidateQueries({ queryKey: ['asn-orders'] });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: getFriendlyErrorMessage(err),
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [accessToken, toast, queryClient, refetch]);

  const serverPaginationConfig = React.useMemo(() => ({
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
    asnOrders,
    pagination,
    loading,
    error,
    refetch,
    page,
    setPage,
    pageSize,
    setPageSize,
    handleSave,
    deleteMutation,
    serverPaginationConfig,
    saving,
    recentlyCreatedId,
  };
}
