import * as React from 'react';

import { usePaymentManagement } from '../../hooks/usePaymentManagement';
import type { Invoice } from '../../types/invoice';
import { DeleteConfirmationDialog } from '../common';
import { PaymentDetailDialog } from './PaymentDetailDialog';
import { PaymentDialog } from './PaymentDialog';
import { PaymentManagementFilters } from './PaymentManagementFilters';
import { PaymentManagementHeader } from './PaymentManagementHeader';
import { PaymentsTable } from './PaymentsTable';
import { PaymentStats } from './PaymentStats';

interface PaymentManagementProps {
  preSelectedInvoice?: Invoice | null;
  pendingPaymentId?: string | null;
  onClearPendingPaymentId?: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export function PaymentManagement({ 
  preSelectedInvoice,
  pendingPaymentId,
  onClearPendingPaymentId,
  onNavigateToInvoice,
}: PaymentManagementProps) {
  const {
    filters,
    setFilters,
    payments,
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
    editPayment,
    paymentToDelete,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  } = usePaymentManagement();

  // Auto-open create dialog when pre-selected invoice is provided
  React.useEffect(() => {
    if (preSelectedInvoice) {
      setCreateDialogOpen(true);
    }
  }, [preSelectedInvoice, setCreateDialogOpen]);

  // Handle pending payment ID from cross-document navigation
  React.useEffect(() => {
    if (pendingPaymentId) {
      // Find the payment and open its detail dialog
      const payment = payments.find(pmt => pmt.id === pendingPaymentId);
      if (payment) {
        handleView(payment);
      }
      onClearPendingPaymentId?.();
    }
  }, [pendingPaymentId, payments, handleView, onClearPendingPaymentId]);

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.status !== 'all' || 
    filters.payment_mode !== 'all' || 
    filters.date_from !== undefined || 
    filters.date_to !== undefined;

  return (
    <div className="space-y-6">
      <PaymentManagementHeader
        isLoading={loading}
        onRefresh={refetch}
        onCreatePayment={handleCreate}
      />

      <PaymentStats
        total={stats.total}
        pending={stats.pending}
        completed={stats.completed}
        totalAmount={stats.total_amount}
      />

      <PaymentManagementFilters
        filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}
      />

      <PaymentsTable
        payments={payments}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreatePayment={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <PaymentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        payment={selectedPayment}
        onEdit={handleEdit}
        onViewInvoice={(invoiceId) => {
          setDetailDialogOpen(false);
          onNavigateToInvoice?.(invoiceId);
        }}
      />

      {/* Create/Edit Dialog */}
      <PaymentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        payment={editPayment}
        preSelectedInvoice={preSelectedInvoice}
        onSave={handleSave}
        saving={false}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Payment"
        description={
          paymentToDelete
            ? `Are you sure you want to delete payment ${paymentToDelete.payment_number}? This action cannot be undone.`
            : 'Are you sure you want to delete this payment?'
        }
      />
    </div>
  );
}
