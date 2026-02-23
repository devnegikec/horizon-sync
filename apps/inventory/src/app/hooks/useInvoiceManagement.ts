import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { Invoice, InvoiceResponse, InvoiceType, InvoiceStatus } from '../types/invoice.types';
import { invoiceApi } from '../utility/api/invoices';

export interface InvoiceFilters {
  search: string;
  invoice_type: string;
  status: string;
}

function useInvoices(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; invoice_type?: string; status?: string }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
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
    () => ({ search: filters?.search, invoice_type: filters?.invoice_type, status: filters?.status }),
    [filters?.search, filters?.invoice_type, filters?.status]
  );

  const handleFetchSuccess = React.useCallback((data: InvoiceResponse) => {
    setInvoices((data.invoices ?? []) as unknown as Invoice[]);
    setPagination(data.pagination ?? null);
  }, []);

  const handleFetchError = React.useCallback((err: unknown) => {
    setError(err instanceof Error ? err.message : 'Failed to load invoices');
    setInvoices([]);
    setPagination(null);
  }, []);

  const fetchInvoices = React.useCallback(async () => {
    if (!accessToken) {
      setInvoices([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = (await invoiceApi.list(accessToken, initialPage, initialPageSize, {
        invoice_type: memoizedFilters?.invoice_type !== 'all' ? memoizedFilters?.invoice_type : undefined,
        status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
        search: memoizedFilters?.search || undefined,
      })) as InvoiceResponse;

      handleFetchSuccess(data);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters, handleFetchSuccess, handleFetchError]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, pagination, loading, error, refetch: fetchInvoices };
}

export function useInvoiceManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<InvoiceFilters>({
    search: '',
    invoice_type: 'all',
    status: 'all',
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<Invoice> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { invoices, pagination, loading, error, refetch } = useInvoices(page, pageSize, filters);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const draft = invoices.filter((inv) => inv.status === 'draft').length;
    const pending = invoices.filter((inv) => inv.status === 'pending').length;
    const paid = invoices.filter((inv) => inv.status === 'paid').length;
    const overdue = invoices.filter((inv) => inv.status === 'overdue').length;
    return { total, draft, pending, paid, overdue };
  }, [invoices, pagination]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => invoiceApi.markAsPaid(accessToken || '', id, data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Invoice marked as paid' });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark invoice as paid',
        variant: 'destructive',
      });
    },
  });

  const handleView = React.useCallback(
    async (invoice: Invoice) => {
      if (!accessToken) return;
      try {
        const fullInvoice = (await invoiceApi.get(accessToken, invoice.id)) as Invoice;
        setSelectedInvoice(fullInvoice);
        setDetailDialogOpen(true);
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load invoice details',
          variant: 'destructive',
        });
      }
    },
    [accessToken, toast]
  );

  const handleCreate = React.useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    (invoice: Invoice) => {
      if (invoice.status !== 'draft') {
        toast({
          title: 'Cannot Delete',
          description: 'Only draft invoices can be deleted',
          variant: 'destructive',
        });
        return;
      }

      if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_no}?`)) {
        deleteMutation.mutate(invoice.id);
      }
    },
    [deleteMutation, toast]
  );

  const handleMarkAsPaid = React.useCallback(
    (invoice: Invoice) => {
      if (invoice.status === 'paid') {
        toast({
          title: 'Already Paid',
          description: 'This invoice is already marked as paid',
          variant: 'destructive',
        });
        return;
      }

      if (window.confirm(`Mark invoice ${invoice.invoice_no} as paid?`)) {
        markAsPaidMutation.mutate({ id: invoice.id });
      }
    },
    [markAsPaidMutation, toast]
  );

  const handleTableReady = React.useCallback((table: Table<Invoice>) => {
    setTableInstance(table);
  }, []);

  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: pageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1);
        setPageSize(newPageSize);
      },
    }),
    [page, pageSize, pagination?.total_items]
  );

  return {
    filters,
    setFilters,
    invoices,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedInvoice,
    setSelectedInvoice,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleDelete,
    handleMarkAsPaid,
    handleTableReady,
    serverPaginationConfig,
  };
}
