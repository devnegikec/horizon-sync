import * as React from 'react';
import { useMemo, useEffect } from 'react';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { PickList, PickListResponse } from '../types/pick-list.types';
import { pickListApi } from '../utility/api/pick-lists';

export interface PickListFilters {
  search: string;
  status: string;
}

function usePickLists(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [pickLists, setPickLists] = React.useState<PickList[]>([]);
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
    () => ({ search: filters?.search, status: filters?.status }),
    [filters?.search, filters?.status]
  );

  const handleFetchSuccess = React.useCallback((data: PickListResponse) => {
    console.log('[usePickLists] API response:', data);
    setPickLists((data.pick_lists ?? []) as unknown as PickList[]);
    setPagination(data.pagination ?? null);
  }, []);

  const handleFetchError = React.useCallback((err: unknown) => {
    console.error('[usePickLists] Error fetching pick lists:', err);
    setError(err instanceof Error ? err.message : 'Failed to load pick lists');
    setPickLists([]);
    setPagination(null);
  }, []);

  const fetchPickLists = React.useCallback(async () => {
    console.log('[usePickLists] fetchPickLists called', { 
      accessToken: !!accessToken, 
      initialPage, 
      initialPageSize, 
      filters: memoizedFilters 
    });
    
    if (!accessToken) {
      console.log('[usePickLists] No access token, skipping fetch');
      setPickLists([]);
      setPagination(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[usePickLists] Calling pickListApi.list...');
      const data = await pickListApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          search: memoizedFilters?.search || undefined,
        }
      ) as PickListResponse;
      
      handleFetchSuccess(data);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters, handleFetchSuccess, handleFetchError]);

  React.useEffect(() => {
    console.log('[usePickLists] useEffect triggered, calling fetchPickLists');
    fetchPickLists();
  }, [fetchPickLists]);

  return { pickLists, pagination, loading, error, refetch: fetchPickLists };
}

export function usePickListManagement() {
  console.log('[usePickListManagement] Hook initialized');
  
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<PickListFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedPickList, setSelectedPickList] = React.useState<PickList | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<PickList> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { pickLists, pagination, loading, error, refetch } = usePickLists(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = pickLists.filter((p) => p.status === 'draft').length;
    const inProgress = pickLists.filter((p) => p.status === 'in_progress').length;
    const completed = pickLists.filter((p) => p.status === 'completed').length;
    return { total, draft, inProgress, completed };
  }, [pickLists, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pickListApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Pick list deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['pick-lists'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete pick list',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(async (pickList: PickList) => {
    if (!accessToken) return;
    try {
      const fullPickList = await pickListApi.get(accessToken, pickList.id) as PickList;
      setSelectedPickList(fullPickList);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load pick list details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleDelete = React.useCallback((pickList: PickList) => {
    if (pickList.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft pick lists can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete pick list ${pickList.pick_list_no}?`)) {
      deleteMutation.mutate(pickList.id);
    }
  }, [deleteMutation, toast]);

  const handleTableReady = React.useCallback((table: Table<PickList>) => {
    setTableInstance(table);
  }, []);

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
    pickLists,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedPickList,
    setSelectedPickList,
    tableInstance,
    setTableInstance,
    handleView,
    handleDelete,
    handleTableReady,
    serverPaginationConfig,
  };
}
