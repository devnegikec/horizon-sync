import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { rfqApi } from '../utility/api';
import type {
  RFQ,
  RFQListItem,
  CreateRFQPayload,
  UpdateRFQPayload,
  RFQsResponse,
  RFQFilters,
  RFQManagementFilters,
} from '../types/rfq.types';

interface UseRFQManagementResult {
  filters: RFQManagementFilters;
  setFilters: React.Dispatch<React.SetStateAction<RFQManagementFilters>>;
  rfqs: RFQListItem[];
  pagination: ReturnType<typeof useRFQsInternal>['pagination'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    draft: number;
    sent: number;
    responded: number;
  };
  detailDialogOpen: boolean;
  setDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRFQ: RFQ | null;
  setSelectedRFQ: React.Dispatch<React.SetStateAction<RFQ | null>>;
  editRFQ: RFQ | null;
  setEditRFQ: React.Dispatch<React.SetStateAction<RFQ | null>>;
  tableInstance: Table<RFQListItem> | null;
  setTableInstance: React.Dispatch<React.SetStateAction<Table<RFQListItem> | null>>;
  saving: boolean;
  handleView: (rfq: RFQListItem) => void;
  handleCreate: () => void;
  handleEdit: (rfq: RFQListItem) => void;
  handleDelete: (rfq: RFQListItem) => void;
  handleSend: (rfq: RFQListItem) => void;
  handleClose: (rfq: RFQListItem) => void;
  handleTableReady: (table: Table<RFQListItem>) => void;
  handleSave: (data: CreateRFQPayload | UpdateRFQPayload, id?: string) => Promise<void>;
  serverPaginationConfig: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, newPageSize: number) => void;
  };
}

// Internal hook for fetching RFQs
function useRFQsInternal(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string; material_request_id?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [rfqs, setRFQs] = React.useState<RFQListItem[]>([]);
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
    [filters?.search, filters?.status, filters?.material_request_id]
  );

  const fetchRFQs = React.useCallback(async () => {
    if (!accessToken) {
      setRFQs([]);
      setPagination(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await rfqApi.list(accessToken, {
        page: initialPage,
        page_size: initialPageSize,
        status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
        material_request_id: memoizedFilters?.material_request_id,
        search: memoizedFilters?.search || undefined,
      }) as RFQsResponse;
      setRFQs(data.rfqs ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQs');
      setRFQs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  return { rfqs, pagination, loading, error, refetch: fetchRFQs };
}

export function useRFQManagement(): UseRFQManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<RFQManagementFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedRFQ, setSelectedRFQ] = React.useState<RFQ | null>(null);
  const [editRFQ, setEditRFQ] = React.useState<RFQ | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<RFQListItem> | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { rfqs, pagination, loading, error, refetch } = useRFQsInternal(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_count ?? 0;
    const draft = rfqs.filter((rfq) => rfq.status === 'draft').length;
    const sent = rfqs.filter((rfq) => rfq.status === 'sent').length;
    const responded = rfqs.filter((rfq) => rfq.status === 'fully_responded' || rfq.status === 'partially_responded').length;
    return { total, draft, sent, responded };
  }, [rfqs, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rfqApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'RFQ deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete RFQ',
        variant: 'destructive',
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => rfqApi.send(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'RFQ sent to suppliers successfully' });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send RFQ',
        variant: 'destructive',
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => rfqApi.close(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'RFQ closed successfully' });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to close RFQ',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(async (rfq: RFQListItem) => {
    if (!accessToken) return;
    try {
      // Fetch full RFQ details including line items and suppliers
      const fullRFQ = await rfqApi.getById(accessToken, rfq.id) as RFQ;
      setSelectedRFQ(fullRFQ);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load RFQ details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreate = React.useCallback(() => {
    setEditRFQ(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(async (rfq: RFQListItem) => {
    if (!accessToken) return;
    if (rfq.status !== 'draft') {
      toast({
        title: 'Cannot Edit',
        description: 'Only draft RFQs can be edited',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Fetch full RFQ details including line items and suppliers
      const fullRFQ = await rfqApi.getById(accessToken, rfq.id) as RFQ;
      setEditRFQ(fullRFQ);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load RFQ details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleDelete = React.useCallback((rfq: RFQListItem) => {
    if (rfq.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft RFQs can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete this RFQ?`)) {
      deleteMutation.mutate(rfq.id);
    }
  }, [deleteMutation, toast]);

  const handleSend = React.useCallback((rfq: RFQListItem) => {
    if (rfq.status !== 'draft') {
      toast({
        title: 'Cannot Send',
        description: 'Only draft RFQs can be sent',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to send this RFQ to suppliers?`)) {
      sendMutation.mutate(rfq.id);
    }
  }, [sendMutation, toast]);

  const handleClose = React.useCallback((rfq: RFQListItem) => {
    if (rfq.status === 'draft' || rfq.status === 'closed') {
      toast({
        title: 'Cannot Close',
        description: 'Only sent or responded RFQs can be closed',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to close this RFQ?`)) {
      closeMutation.mutate(rfq.id);
    }
  }, [closeMutation, toast]);

  const handleTableReady = React.useCallback((table: Table<RFQListItem>) => {
    setTableInstance(table);
  }, []);

  const handleSave = React.useCallback(async (data: CreateRFQPayload | UpdateRFQPayload, id?: string) => {
    if (!accessToken) return;

    setSaving(true);
    try {
      if (id) {
        await rfqApi.update(accessToken, id, data as UpdateRFQPayload);
        toast({ title: 'Success', description: 'RFQ updated successfully' });
      } else {
        await rfqApi.create(accessToken, data as CreateRFQPayload);
        toast({ title: 'Success', description: 'RFQ created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save RFQ',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setSaving(false);
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
    rfqs,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedRFQ,
    setSelectedRFQ,
    editRFQ,
    setEditRFQ,
    tableInstance,
    setTableInstance,
    saving,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSend,
    handleClose,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  };
}
