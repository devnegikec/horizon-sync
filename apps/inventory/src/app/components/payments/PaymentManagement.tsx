import { useState, useMemo, useCallback, useEffect } from 'react';

import { DollarSign, Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';
import { usePayments } from '../../hooks/usePayments';
import { usePaymentActions } from '../../hooks/usePaymentActions';
import { paymentApi } from '../../utility/api';

import type { Invoice } from '../../types/invoice';
import type { PaymentEntry, PaymentFilters as Filters } from '../../types/payment.types';
import { getStatIconColors } from '../../utils/payment.utils';

import { PaymentDialog } from './PaymentDialog';
import { PaymentDetailDialog } from './PaymentDetailDialog';
import { StatCard } from './StatCard';
import type { PaymentEntry, PaymentFilters as Filters } from '../../types/payment.types';
import type { Invoice } from '../../types/invoice';
import { PaymentFilters } from './PaymentFilters';
import { PaymentTable } from './PaymentTable';
import { StatCard } from './StatCard';

export interface PaymentManagementProps {
  preSelectedInvoice?: Invoice | null;
  pendingPaymentId?: string | null;
  onClearPendingPaymentId?: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export function PaymentManagement({
  preSelectedInvoice = null,
  pendingPaymentId = null,
  onClearPendingPaymentId,
  onNavigateToInvoice,
}: PaymentManagementProps) {
  const [filters, setFilters] = useState<Partial<Filters>>({
    status: undefined,
    payment_mode: undefined,
    payment_type: undefined,
    search: '',
    page: 1,
    page_size: 10,
  });

  const { payments, loading, error, totalCount, refetch } = usePayments(filters);
  const { confirmPayment, cancelPayment } = usePaymentActions();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [paymentForDetail, setPaymentForDetail] = useState<PaymentEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleViewPayment = useCallback((payment: PaymentEntry) => {
    // TODO: Implement view details dialog
    console.log('View payment:', payment);
  }, []);

  // Handle pre-selected invoice (for recording payment from invoice)
  useEffect(() => {
    if (preSelectedInvoice) {
      setSelectedPayment(null);
      setDialogOpen(true);
    }
  }, [preSelectedInvoice]);

  // Handle pending payment ID (for viewing specific payment)
  useEffect(() => {
    if (pendingPaymentId) {
      const payment = payments.find(p => p.id === pendingPaymentId);
      if (payment) {
        handleViewPayment(payment);
        onClearPendingPaymentId?.();
      }
    }
  }, [pendingPaymentId, payments, onClearPendingPaymentId, handleViewPayment]);

  // Memoize expensive stats calculation
  const paymentStats = useMemo(() => ({
    total: totalCount,
    draft: payments.filter((p) => p.status === 'Draft').length,
    confirmed: payments.filter((p) => p.status === 'Confirmed').length,
    cancelled: payments.filter((p) => p.status === 'Cancelled').length,
  }), [totalCount, payments]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCreatePayment = useCallback(() => {
    setSelectedPayment(null);
    setDialogOpen(true);
  }, []);

  const handleViewPayment = useCallback(
    async (payment: PaymentEntry) => {
      setPaymentForDetail(payment);
      setDetailDialogOpen(true);
      setDetailLoading(true);
      try {
        const fullPayment = await paymentApi.fetchPaymentById(payment.id);
        setPaymentForDetail(fullPayment);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load payment details';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        setDetailDialogOpen(false);
        setPaymentForDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  const handleEditPayment = useCallback((payment: PaymentEntry) => {
    setSelectedPayment(payment);
    setDialogOpen(true);
  }, []);

  const handleConfirmPayment = useCallback(async (payment: PaymentEntry) => {
    const paymentIdentifier = payment.receipt_number || payment.id;
    if (window.confirm(`Are you sure you want to confirm payment ${paymentIdentifier}?`)) {
      const result = await confirmPayment(payment.id);
      if (result) {
        refetch();
      }
    }
  }, [confirmPayment, refetch]);

  const handleCancelPayment = useCallback(async (payment: PaymentEntry) => {
    const cancellationReason = window.prompt('Please enter cancellation reason:');
    if (cancellationReason) {
      const result = await cancelPayment(payment.id, cancellationReason);
      if (result) {
        refetch();
      }
    }
  }, [cancelPayment, refetch]);

  const handleDialogSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDetailEdit = useCallback(() => {
    if (paymentForDetail) {
      setDetailDialogOpen(false);
      setSelectedPayment(paymentForDetail);
      setDialogOpen(true);
      setPaymentForDetail(null);
    }
  }, [paymentForDetail]);

  const handleDetailConfirm = useCallback(
    async () => {
      if (!paymentForDetail) return;
      const paymentIdentifier = paymentForDetail.receipt_number || paymentForDetail.id;
      if (window.confirm(`Are you sure you want to confirm payment ${paymentIdentifier}?`)) {
        const result = await confirmPayment(paymentForDetail.id);
        if (result) {
          setDetailDialogOpen(false);
          setPaymentForDetail(null);
          refetch();
        }
      }
    },
    [paymentForDetail, confirmPayment, refetch]
  );

  const handleDetailCancel = useCallback(
    async () => {
      if (!paymentForDetail) return;
      const reason = window.prompt('Please enter cancellation reason:');
      if (reason) {
        const result = await cancelPayment(paymentForDetail.id, reason);
        if (result) {
          setDetailDialogOpen(false);
          setPaymentForDetail(null);
          refetch();
        }
      }
    },
    [paymentForDetail, cancelPayment, refetch]
  );

  const handleDetailClose = useCallback((open: boolean) => {
    if (!open) {
      setPaymentForDetail(null);
    }
    setDetailDialogOpen(open);
  }, []);

  const handleDetailAllocationChange = useCallback(async () => {
    if (paymentForDetail?.id) {
      try {
        const fullPayment = await paymentApi.fetchPaymentById(paymentForDetail.id);
        setPaymentForDetail(fullPayment);
        refetch();
      } catch {
        refetch();
      }
    }
  }, [paymentForDetail?.id, refetch]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">Manage customer and supplier payments</p>
        </div>
        <Button onClick={handleCreatePayment}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
          <Plus className="h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Payments"
          value={paymentStats.total}
          icon={DollarSign}
          iconBg={getStatIconColors('total').bg}
          iconColor={getStatIconColors('total').icon}/>
        <StatCard title="Draft"
          value={paymentStats.draft}
          icon={DollarSign}
          iconBg={getStatIconColors('draft').bg}
          iconColor={getStatIconColors('draft').icon}/>
        <StatCard title="Confirmed"
          value={paymentStats.confirmed}
          icon={DollarSign}
          iconBg={getStatIconColors('confirmed').bg}
          iconColor={getStatIconColors('confirmed').icon}/>
        <StatCard title="Cancelled"
          value={paymentStats.cancelled}
          icon={DollarSign}
          iconBg={getStatIconColors('cancelled').bg}
          iconColor={getStatIconColors('cancelled').icon}/>
      </div>

      {/* Filters */}
      <PaymentFilters filters={filters} setFilters={setFilters} />

      {/* Payments Table */}
      <PaymentTable payments={payments}
        loading={loading}
        error={error}
        onView={handleViewPayment}
        onEdit={handleEditPayment}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}/>

      {/* Create/Edit Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        onSuccess={handleDialogSuccess}
      />

      {/* View Details Dialog */}
      {paymentForDetail && (
        <PaymentDetailDialog
          open={detailDialogOpen}
          onOpenChange={handleDetailClose}
          payment={paymentForDetail}
          onEdit={handleDetailEdit}
          onConfirm={handleDetailConfirm}
          onCancel={handleDetailCancel}
          onAllocationChange={handleDetailAllocationChange}
          loading={detailLoading}
        />
      )}
    </div>
  );
}
