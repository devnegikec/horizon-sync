import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { invoiceApi } from '../api/invoices';
import type { 
  Invoice, 
  InvoiceFormData, 
  InvoiceListResponse,
  InvoiceStats 
} from '../types/invoice';
import type { SendInvoiceEmailData } from '../api/invoices';

export interface InvoiceFilters {
  search: string;
  status: string;
  date_from?: string;
  date_to?: string;
}

interface UseInvoiceManagementResult {
  filters: InvoiceFilters;
  setFilters: React.Dispatch<React.SetStateAction<InvoiceFilters>>;
  invoices: Invoice[];
  pagination: ReturnType<typeof useInvoices>['pagination'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: InvoiceStats;
  detailDialogOpen: boolean;
  setDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  emailDialogOpen: boolean;
  setEmailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  editInvoice: Invoice | null;
  setEditInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  invoiceToDelete: Invoice | null;
  setInvoiceToDelete: React.Dispatch<React.SetStateAction<Invoice | null>>;
  tableInstance: Table<Invoice> | null;
  setTableInstance: React.Dispatch<React.SetStateAction<Table<Invoice> | null>>;
  handleView: (invoice: Invoice) => void;
  handleCreate: () => void;
  handleEdit: (invoice: Invoice) => void;
  handleDelete: (invoice: Invoice) => void;
  handleConfirmDelete: () => void;
  handleSendEmail: (invoice: Invoice) => void;
  handleGeneratePDF: (invoiceId: string) => Promise<void>;
  handleTableReady: (table: Table<Invoice>) => void;
  handleSave: (data: InvoiceFormData, id?: string) => Promise<void>;
  handleEmailSend: (invoiceId: string, emailData: SendInvoiceEmailData) => Promise<void>;
  serverPaginationConfig: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, newPageSize: number) => void;
  };
}

// Internal hook to fetch invoices with pagination and filters
function useInvoices(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string; date_from?: string | null; date_to?: string | null }
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
    () => filters,
    [filters?.search, filters?.status, filters?.date_from, filters?.date_to]
  );

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
      const data = await invoiceApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          search: memoizedFilters?.search || undefined,
          date_from: memoizedFilters?.date_from || undefined,
          date_to: memoizedFilters?.date_to || undefined,
        }
      ) as InvoiceListResponse;
      setInvoices(data.invoices ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      setInvoices([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, pagination, loading, error, refetch: fetchInvoices };
}

export function useInvoiceManagement(): UseInvoiceManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<InvoiceFilters>({
    search: '',
    status: 'all',
    date_from: undefined,
    date_to: undefined,
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = React.useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<Invoice | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<Invoice> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { invoices, pagination, loading, error, refetch } = useInvoices(page, pageSize, filters);

  // Calculate statistics from current data
  const stats = useMemo<InvoiceStats>(() => {
    const total = pagination?.total_items ?? 0;
    const draft = invoices.filter((inv) => inv.status === 'Draft').length;
    const submitted = invoices.filter((inv) => inv.status === 'Submitted').length;
    const paid = invoices.filter((inv) => inv.status === 'Paid').length;
    const overdue = invoices.filter((inv) => inv.status === 'Overdue').length;
    const total_outstanding = invoices.reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);
    
    return { total, draft, submitted, paid, overdue, total_outstanding };
  }, [invoices, pagination]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
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

  // View invoice handler - fetches full details
  const handleView = React.useCallback(async (invoice: Invoice) => {
    if (!accessToken) return;
    try {
      // Fetch full invoice details including line items and payments
      const fullInvoice = await invoiceApi.get(accessToken, invoice.id) as Invoice;
      setSelectedInvoice(fullInvoice);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load invoice details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  // Create new invoice handler
  const handleCreate = React.useCallback(() => {
    setEditInvoice(null);
    setCreateDialogOpen(true);
  }, []);

  // Edit invoice handler - fetches full details
  const handleEdit = React.useCallback(async (invoice: Invoice) => {
    if (!accessToken) return;
    
    // Check if invoice can be edited
    if (invoice.status !== 'Draft') {
      toast({
        title: 'Cannot Edit',
        description: 'Only draft invoices can be edited',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch full invoice details including line items
      const fullInvoice = await invoiceApi.get(accessToken, invoice.id) as Invoice;
      setEditInvoice(fullInvoice);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load invoice details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  // Delete invoice handler - opens confirmation dialog
  const handleDelete = React.useCallback((invoice: Invoice) => {
    if (invoice.status !== 'Draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft invoices can be deleted',
        variant: 'destructive',
      });
      return;
    }

    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  }, [toast]);

  // Confirm delete handler - actually deletes the invoice
  const handleConfirmDelete = React.useCallback(() => {
    if (invoiceToDelete) {
      deleteMutation.mutate(invoiceToDelete.id);
      setInvoiceToDelete(null);
    }
  }, [invoiceToDelete, deleteMutation]);

  // Send email handler
  const handleSendEmail = React.useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailDialogOpen(false);
    setEmailDialogOpen(true);
  }, []);

  // Generate PDF handler
  const handleGeneratePDF = React.useCallback(async (invoiceId: string) => {
    if (!accessToken) return;
    
    try {
      const blob = await invoiceApi.generateInvoicePDF(accessToken, invoiceId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Invoice PDF generated successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  // Table ready handler
  const handleTableReady = React.useCallback((table: Table<Invoice>) => {
    setTableInstance(table);
  }, []);

  // Save invoice handler (create or update)
  const handleSave = React.useCallback(async (data: InvoiceFormData, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        await invoiceApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Invoice updated successfully' });
      } else {
        await invoiceApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Invoice created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save invoice',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch]);

  // Send email handler
  const handleEmailSend = React.useCallback(async (invoiceId: string, emailData: SendInvoiceEmailData) => {
    if (!accessToken) return;

    try {
      await invoiceApi.sendInvoiceEmail(accessToken, invoiceId, emailData);
      toast({
        title: 'Success',
        description: 'Invoice email sent successfully',
      });
      setEmailDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send email',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast]);

  // Server pagination configuration
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
    emailDialogOpen,
    setEmailDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedInvoice,
    setSelectedInvoice,
    editInvoice,
    setEditInvoice,
    invoiceToDelete,
    setInvoiceToDelete,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleSendEmail,
    handleGeneratePDF,
    handleTableReady,
    handleSave,
    handleEmailSend,
    serverPaginationConfig,
  };
}
