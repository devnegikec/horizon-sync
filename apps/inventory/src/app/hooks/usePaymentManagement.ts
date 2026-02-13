import * as React from 'react';
import { useMemo, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';

import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { paymentApi } from '../api/payments';
import type { 
  Payment, 
  PaymentFormData, 
  PaymentListResponse,
  PaymentStats 
} from '../types/payment';

export interface PaymentFilters {
  search: string;
  status: string;
  payment_mode: string;
  date_from?: string;
  date_to?: string;
}

interface UsePaymentManagementResult {
  filters: PaymentFilters;
  setFilters: React.Dispatch<React.SetStateAction<PaymentFilters>>;
  payments: Payment[];
  pagination: ReturnType<typeof usePayments>['pagination'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: PaymentStats;
  detailDialogOpen: boolean;
  setDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPayment: Payment | null;
  setSelectedPayment: React.Dispatch<React.SetStateAction<Payment | null>>;
  editPayment: Payment | null;
  setEditPayment: React.Dispatch<React.SetStateAction<Payment | null>>;
  paymentToDelete: Payment | null;
  setPaymentToDelete: React.Dispatch<React.SetStateAction<Payment | null>>;
  tableInstance: Table<Payment> | null;
  setTableInstance: React.Dispatch<React.SetStateAction<Table<Payment> | null>>;
  handleView: (payment: Payment) => void;
  handleCreate: () => void;
  handleEdit: (payment: Payment) => void;
  handleDelete: (payment: Payment) => void;
  handleConfirmDelete: () => void;
  handleTableReady: (table: Table<Payment>) => void;
  handleSave: (data: PaymentFormData, id?: string) => Promise<void>;
  serverPaginationConfig: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, newPageSize: number) => void;
  };
}

// Internal hook to fetch payments with pagination and filters
function usePayments(
  initialPage: number,
  initialPageSize: number,
  filters?: { search?: string; status?: string; payment_mode?: string; date_from?: string | null; date_to?: string | null }
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [payments, setPayments] = React.useState<Payment[]>([]);
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
    [filters?.search, filters?.status, filters?.payment_mode, filters?.date_from, filters?.date_to]
  );

  const fetchPayments = React.useCallback(async () => {
    if (!accessToken) {
      setPayments([]);
      setPagination(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await paymentApi.list(
        accessToken,
        initialPage,
        initialPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          payment_mode: memoizedFilters?.payment_mode !== 'all' ? memoizedFilters?.payment_mode : undefined,
          search: memoizedFilters?.search || undefined,
          date_from: memoizedFilters?.date_from || undefined,
          date_to: memoizedFilters?.date_to || undefined,
        }
      ) as PaymentListResponse;
      setPayments(data.payments ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
      setPayments([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, initialPage, initialPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, pagination, loading, error, refetch: fetchPayments };
}

export function usePaymentManagement(): UsePaymentManagementResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<PaymentFilters>({
    search: '',
    status: 'all',
    payment_mode: 'all',
    date_from: undefined,
    date_to: undefined,
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [editPayment, setEditPayment] = React.useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = React.useState<Payment | null>(null);
  const [tableInstance, setTableInstance] = React.useState<Table<Payment> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { payments, pagination, loading, error, refetch } = usePayments(page, pageSize, filters);

  // Calculate statistics from current data
  const stats = useMemo<PaymentStats>(() => {
    const total = pagination?.total_items ?? 0;
    const pending = payments.filter((pmt) => pmt.status === 'Draft').length;
    const completed = payments.filter((pmt) => pmt.status === 'Submitted' || pmt.status === 'Reconciled').length;
    const total_amount = payments
      .filter((pmt) => pmt.status === 'Submitted' || pmt.status === 'Reconciled')
      .reduce((sum, pmt) => sum + Number(pmt.total_amount), 0);
    
    return { total, pending, completed, total_amount };
  }, [payments, pagination]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.delete(accessToken || '', id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payment deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      refetch();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete payment',
        variant: 'destructive',
      });
    },
  });

  // View payment handler - fetches full details
  const handleView = React.useCallback(async (payment: Payment) => {
    if (!accessToken) return;
    try {
      // Fetch full payment details including allocations
      const fullPayment = await paymentApi.get(accessToken, payment.id) as Payment;
      setSelectedPayment(fullPayment);
      setDetailDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load payment details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  // Create new payment handler
  const handleCreate = React.useCallback(() => {
    setEditPayment(null);
    setCreateDialogOpen(true);
  }, []);

  // Edit payment handler - fetches full details
  const handleEdit = React.useCallback(async (payment: Payment) => {
    if (!accessToken) return;
    
    // Check if payment can be edited
    if (payment.status !== 'Draft') {
      toast({
        title: 'Cannot Edit',
        description: 'Only draft payments can be edited',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Fetch full payment details including allocations
      const fullPayment = await paymentApi.get(accessToken, payment.id) as Payment;
      setEditPayment(fullPayment);
      setDetailDialogOpen(false);
      setCreateDialogOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load payment details',
        variant: 'destructive',
      });
    }
  }, [accessToken, toast]);

  // Delete payment handler - opens confirmation dialog
  const handleDelete = React.useCallback((payment: Payment) => {
    if (payment.status !== 'Draft') {
      toast({
        title: 'Cannot Delete',
        description: 'Only draft payments can be deleted',
        variant: 'destructive',
      });
      return;
    }

    setPaymentToDelete(payment);
    setDeleteDialogOpen(true);
  }, [toast]);

  // Confirm delete handler - actually deletes the payment
  const handleConfirmDelete = React.useCallback(() => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  }, [paymentToDelete, deleteMutation]);

  // Table ready handler
  const handleTableReady = React.useCallback((table: Table<Payment>) => {
    setTableInstance(table);
  }, []);

  // Save payment handler (create or update)
  const handleSave = React.useCallback(async (data: PaymentFormData, id?: string) => {
    if (!accessToken) return;

    try {
      if (id) {
        await paymentApi.update(accessToken, id, data);
        toast({ title: 'Success', description: 'Payment updated successfully' });
      } else {
        await paymentApi.create(accessToken, data);
        toast({ title: 'Success', description: 'Payment created successfully' });
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      setCreateDialogOpen(false);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save payment',
        variant: 'destructive',
      });
      throw err;
    }
  }, [accessToken, toast, queryClient, refetch]);

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
    payments,
    pagination,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedPayment,
    setSelectedPayment,
    editPayment,
    setEditPayment,
    paymentToDelete,
    setPaymentToDelete,
    tableInstance,
    setTableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  };
}
