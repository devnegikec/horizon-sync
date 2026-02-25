import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { quotationApi } from '../utility/api';
import type { Quotation, QuotationCreate, QuotationUpdate, QuotationResponse } from '../types/quotation.types';

export const QUOTATIONS_QUERY_KEY = ['quotations'] as const;

export type QuotationsPagination = {
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
};

export interface QuotationFilters {
  search: string;
  status: string;
}

interface UseQuotationManagementResult {
  filters: QuotationFilters;
  setFilters: React.Dispatch<React.SetStateAction<QuotationFilters>>;
  quotations: Quotation[];
  pagination: QuotationsPagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
  };
  detailDialogOpen: boolean;
  setDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedQuotation: Quotation | null;
  setSelectedQuotation: React.Dispatch<React.SetStateAction<Quotation | null>>;
  editQuotation: Quotation | null;
  setEditQuotation: React.Dispatch<React.SetStateAction<Quotation | null>>;
  tableInstance: Table<Quotation> | null;
  setTableInstance: React.Dispatch<React.SetStateAction<Table<Quotation> | null>>;
  handleView: (quotation: Quotation) => void;
  handleCreate: () => void;
  handleEdit: (quotation: Quotation) => void;
  handleDelete: (quotation: Quotation) => void;
  handleConvert: (quotation: Quotation) => void;
  handleTableReady: (table: Table<Quotation>) => void;
  handleSave: (data: QuotationCreate | QuotationUpdate, id?: string) => Promise<void>;
  serverPaginationConfig: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, newPageSize: number) => void;
  };
}

async function fetchQuotations(
  accessToken: string,
  page: number,
  pageSize: number,
  filters: { search?: string; status?: string }
): Promise<QuotationResponse> {
  const result = await quotationApi.list(accessToken, page, pageSize, {
    status: filters?.status !== 'all' ? filters?.status : undefined,
    search: filters?.search || undefined,
  });
  return result as QuotationResponse;
}

function useQuotations(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const memoizedFilters = React.useMemo(
    () => filters,
    [filters?.search, filters?.status]
  );

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, initialPage, initialPageSize, memoizedFilters],
    queryFn: () =>
      fetchQuotations(accessToken!, initialPage, initialPageSize, memoizedFilters ?? {}),
    enabled: !!accessToken,
    placeholderData: (previousData) => previousData,
  });

  const quotations: Quotation[] = data?.quotations ?? [];
  const pagination: QuotationsPagination | null = data?.pagination ?? null;
  const error: string | null = queryError
    ? (queryError instanceof Error ? queryError.message : 'Failed to load quotations')
    : null;

  const refetch = React.useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return { quotations, pagination, loading, error, refetch };
}

export function useQuotationManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<QuotationFilters>({
    search: '',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [converting, setConverting] = React.useState(false);
  const [selectedQuotation, setSelectedQuotation] = React.useState<Quotation | null>(null);
  const [editQuotation, setEditQuotation] = React.useState<Quotation | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<Quotation> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { quotations, pagination, loading, error, refetch } = useQuotations(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = quotations.filter((q) => q.status === 'draft').length;
    const sent = quotations.filter((q) => q.status === 'sent').length;
    const accepted = quotations.filter((q) => q.status === 'accepted').length;
    return { total, draft, sent, accepted };
  }, [quotations, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotationApi.delete(accessToken || '', id),
    onSuccess: async () => {
      toast({ title: 'Success', description: 'Quotation deleted successfully' });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      await refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete quotation',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(async (quotation: Quotation) => {
    if (!accessToken) return;
    try {
      // Fetch full quotation details including line items
      const fullQuotation = await quotationApi.get(accessToken, quotation.id) as Quotation;
      setSelectedQuotation(fullQuotation);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load quotation details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleCreate = React.useCallback(() => {
    setEditQuotation(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEdit = React.useCallback(async (quotation: Quotation) => {
    if (!accessToken) return;
    try {
      // Fetch full quotation details including line items
      const fullQuotation = await quotationApi.get(accessToken, quotation.id) as Quotation;
      setEditQuotation(fullQuotation);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load quotation details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  const handleDelete = React.useCallback((quotation: Quotation) => {
    if (quotation.status !== 'draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft quotations can be deleted',
        variant: 'destructive',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete quotation ${quotation.quotation_no}?`)) {
      deleteMutation.mutate(quotation.id);
    }
  }, [deleteMutation, toast]);

  const handleConvert = React.useCallback(async (quotation: Quotation) => {
    if (!accessToken) return;
    const fullQuotation = await quotationApi.get(accessToken, quotation.id) as Quotation;
    setSelectedQuotation(fullQuotation);
    setDetailDialogOpen(false);
    setConvertDialogOpen(true);
  }, []);

  const handleConvertConfirm = React.useCallback(async (quotationId: string, data: { order_date: string; delivery_date?: string }) => {
    if (!accessToken) return;
    setConverting(true);
    try {
      const result = await quotationApi.convertToSalesOrder(accessToken, quotationId, data) as { sales_order_id: string; sales_order_no: string; message: string };
      
      // Update the quotation's converted_to_sales_order flag locally
      setSelectedQuotation(prev => prev ? { ...prev, converted_to_sales_order: true } : null);
      
      toast({
        title: 'Success',
        description: result.message || `Quotation converted to sales order ${result.sales_order_no} successfully`,
      });
      setConvertDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      await refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to convert quotation to sales order',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setConverting(false);
    }
  }, [accessToken, toast, queryClient, refetch]);

  const handleTableReady = React.useCallback((table: Table<Quotation>) => {
    setTableInstance(table);
  }, []);

  const handleSave = React.useCallback(async (data: QuotationCreate | QuotationUpdate, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        await quotationApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Quotation updated successfully' });
      } else {
        await quotationApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Quotation created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      setCreateDialogOpen(false);
      await refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save quotation',
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
    quotations,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedQuotation,
    setSelectedQuotation,
    editQuotation,
    setEditQuotation,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConvert,
    handleConvertConfirm,
    convertDialogOpen,
    setConvertDialogOpen,
    converting,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  };
}

