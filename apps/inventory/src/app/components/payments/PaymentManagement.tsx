import { useState, useMemo, useCallback } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components';
import { usePayments } from '../../hooks/usePayments';
import { usePaymentActions } from '../../hooks/usePaymentActions';
import { getStatIconColors } from '../../utils/payment.utils';
import { PaymentTable } from './PaymentTable';
import { PaymentFilters } from './PaymentFilters';
import { PaymentDialog } from './PaymentDialog';
import { StatCard } from './StatCard';
import type { PaymentEntry, PaymentFilters as Filters } from '../../types/payment.types';
import type { Invoice } from '../../types/invoice';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentEntry | null>(null);

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

  const handleViewPayment = useCallback((payment: PaymentEntry) => {
    // TODO: Implement view details dialog
    console.log('View payment:', payment);
  }, []);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">Manage customer and supplier payments</p>
        </div>
        <Button
          onClick={handleCreatePayment}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Payments"
          value={paymentStats.total}
          icon={DollarSign}
          iconBg={getStatIconColors('total').bg}
          iconColor={getStatIconColors('total').icon}
        />
        <StatCard
          title="Draft"
          value={paymentStats.draft}
          icon={DollarSign}
          iconBg={getStatIconColors('draft').bg}
          iconColor={getStatIconColors('draft').icon}
        />
        <StatCard
          title="Confirmed"
          value={paymentStats.confirmed}
          icon={DollarSign}
          iconBg={getStatIconColors('confirmed').bg}
          iconColor={getStatIconColors('confirmed').icon}
        />
        <StatCard
          title="Cancelled"
          value={paymentStats.cancelled}
          icon={DollarSign}
          iconBg={getStatIconColors('cancelled').bg}
          iconColor={getStatIconColors('cancelled').icon}
        />
      </div>

      {/* Filters */}
      <PaymentFilters filters={filters} setFilters={setFilters} />

      {/* Payments Table */}
      <PaymentTable
        payments={payments}
        loading={loading}
        error={error}
        onView={handleViewPayment}
        onEdit={handleEditPayment}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
      />

      {/* Dialog */}
      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
