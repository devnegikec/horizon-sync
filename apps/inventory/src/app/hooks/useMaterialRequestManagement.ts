import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { materialRequestApi } from '../utility/api';
import type {
  MaterialRequest,
  MaterialRequestListItem,
  CreateMaterialRequestPayload,
  UpdateMaterialRequestPayload,
  MaterialRequestListResponse,
} from '../types/material-request.types';

export interface MaterialRequestFilters {
  search: string;
  status: string;
  type?: string;
  priority?: string;
}

interface UseMaterialRequestManagementResult {
  filters: MaterialRequestFilters;
  setFilters: React.Dispatch<React.SetStateAction<MaterialRequestFilters>>;
  materialRequests: MaterialRequestListItem[];
  pagination: ReturnType<typeof useMaterialRequestsInternal>['pagination'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    draft: number;
    submitted: number;
    quoted: number;
  };
  detailDialogOpen: boolean;
  setDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMaterialRequest: MaterialRequest | null;
  setSelectedMaterialRequest: React.Dispatch<React.SetStateAction<MaterialRequest | null>>;
  editMaterialRequest: MaterialRequest | null;
  setEditMaterialRequest: React.Dispatch<React.SetStateAction<MaterialRequest | null>>;
  tableInstance: Table<MaterialRequestListItem> | null;
  setTableInstance: React.Dispatch<React.SetStateAction<Table<MaterialRequestListItem> | null>>;
  handleView: (mr: MaterialRequestListItem) => void;
  handleCreate: () => void;
  handleEdit: (mr: MaterialRequestListItem) => void;
  handleDelete: (mr: MaterialRequestListItem) => void;
  handleSubmit: (mr: MaterialRequestListItem) => void;
  handleCancel: (mr: MaterialRequestListItem) => void;
  handleTableReady: (table: Table<MaterialRequestListItem>) => void;
  handleSave: (data: CreateMaterialRequestPayload | UpdateMaterialRequestPayload, id?: string) => Promise<void>;
  serverPaginationConfig: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, newPageSize: number) => void;
  };
}

// Internal hook for fetching material requests
function useMaterialRequestsInternal(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string; type?: string; priority?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [materialRequests, setMaterialRequests] = React.useState<MaterialRequestListItem[]>([]);
  const [pagination, setPagination] = React.useState<{
    total_count: number;
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
    [filters?.search, filters?.status, filters?.type, filters?.priority]
  );

  const fetchMaterialRequests = React.useCallback(async () => {
    if (!accessToken) {
      setMaterialRequests([]);
      setPagination(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await materialRequestApi.list(accessToken, {
        page: initialPage,
        page_size: initialPageSize,
        status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
        type: memoizedFilters?.type,
        priority: memoizedFilters?.priority,
        search: memoizedFilters?.search || undefined,
      }) as MaterialRequestListResponse;
      setMaterialRequests(data.material_requests ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load material requests');
      setMaterialRequests([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchMaterialRequests();
  }, [fetchMaterialRequests]);

  return { materialRequests, pagination, loading, error, refetch: fetchMaterialRequests };
}

export function useMaterialRequestManagement(): UseMaterialRequestManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<MaterialRequestFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedMaterialRequest, setSelectedMaterialRequest] = React.useState<MaterialRequest | null>(null);
  const [editMaterialRequest, setEditMaterialRequest] = React.useState<MaterialRequest | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<MaterialRequestListItem> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { materialRequests, pagination, loading, error, refetch } = useMaterialRequestsInternal(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_count ?? 0;
    const draft = materialRequests.filter((mr) => mr.status === 'draft').length;
    const submitted = materialRequests.filter((mr) => mr.status === 'submitted').length;
    const quoted = materialRequests.filter((mr) => mr.status === 'fully_quoted' || mr.status === 'partially_quoted').length;
    return { total, draft, submitted, quoted };
  }, [materialRequests, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialRequestApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material Request deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete material request',
        variant: 'destructive',
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => materialRequestApi.submit(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material Request submitted successfully' });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to submit material request',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => materialRequestApi.cancel(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Material Request cancelled successfully' });
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cancel material request',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(async (mr: MaterialRequestListItem) => {
    if (!accessToken) return;
    try {
      // Fetch full material request details including line items
      const fullMaterialRequest = await materialRequestApi.get(accessToken, mr.id) as MaterialRequest;
      setSelectedMaterialRequest(fullMaterialRequest);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load material request details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreate = React.useCallback(() => {
    setEditMaterialRequest(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(async (mr: MaterialRequestListItem) => {
    if (!accessToken) return;
    if (mr.status !== 'draft') {
      toast({
        title: 'Cannot Edit',
        description: 'Only draft material requests can be edited',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Fetch full material request details including line items
      const fullMaterialRequest = await materialRequestApi.get(accessToken, mr.id) as MaterialRequest;
      setEditMaterialRequest(fullMaterialRequest);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load material request details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleDelete = React.useCallback((mr: MaterialRequestListItem) => {
    if (mr.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft material requests can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete material request ${mr.request_no}?`)) {
      deleteMutation.mutate(mr.id);
    }
  }, [deleteMutation, toast]);

  const handleSubmit = React.useCallback((mr: MaterialRequestListItem) => {
    if (mr.status !== 'draft') {
      toast({
        title: 'Cannot Submit',
        description: 'Only draft material requests can be submitted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to submit material request ${mr.request_no}?`)) {
      submitMutation.mutate(mr.id);
    }
  }, [submitMutation, toast]);

  const handleCancel = React.useCallback((mr: MaterialRequestListItem) => {
    if (mr.status !== 'draft' && mr.status !== 'submitted') {
      toast({
        title: 'Cannot Cancel',
        description: 'Only draft or submitted material requests can be cancelled',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to cancel material request ${mr.request_no}?`)) {
      cancelMutation.mutate(mr.id);
    }
  }, [cancelMutation, toast]);

  const handleTableReady = React.useCallback((table: Table<MaterialRequestListItem>) => {
    setTableInstance(table);
  }, []);

  const handleSave = React.useCallback(async (data: CreateMaterialRequestPayload | UpdateMaterialRequestPayload, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        await materialRequestApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Material Request updated successfully' });
      } else {
        await materialRequestApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Material Request created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save material request',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch]);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1,
    pageSize: pageSize,
    totalItems: pagination?.total_count ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    }
  }), [page, pageSize, pagination?.total_count]);

  return {
    filters,
    setFilters,
    materialRequests,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedMaterialRequest,
    setSelectedMaterialRequest,
    editMaterialRequest,
    setEditMaterialRequest,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleCancel,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  };
}
