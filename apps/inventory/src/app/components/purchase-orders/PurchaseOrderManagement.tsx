import { useState } from 'react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { usePurchaseOrderActions } from '../../hooks/usePurchaseOrderActions';
import type { PurchaseOrder, PurchaseOrderListItem } from '../../types/purchase-order.types';

import {
  PurchaseOrderHeader,
  PurchaseOrderFilters,
  PurchaseOrderTable,
  PurchaseOrderDialog,
  PurchaseOrderDetailDialog,
} from './index';

export function PurchaseOrderManagement() {
  const {
    purchaseOrders,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  } = usePurchaseOrders();

  const {
    loading: actionLoading,
    submitPurchaseOrder,
    cancelPurchaseOrder,
    closePurchaseOrder,
    deletePurchaseOrder,
  } = usePurchaseOrderActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);

  const handleCreate = () => {
    setSelectedPurchaseOrder(null);
    setDialogOpen(true);
  };

  const handleEdit = (po: PurchaseOrderListItem) => {
    if (po.status !== 'draft') {
      return;
    }
    setSelectedPurchaseOrder(po as unknown as PurchaseOrder);
    setDialogOpen(true);
  };

  const handleView = (po: PurchaseOrderListItem) => {
    setSelectedPurchaseOrder(po as unknown as PurchaseOrder);
    setDetailDialogOpen(true);
  };

  const handleSubmit = async (po: PurchaseOrderListItem) => {
    const result = await submitPurchaseOrder(po.id);
    if (result) {
      refetch();
    }
  };

  const handleCancel = async (po: PurchaseOrderListItem) => {
    const result = await cancelPurchaseOrder(po.id);
    if (result) {
      refetch();
    }
  };

  const handleClose = async (po: PurchaseOrderListItem) => {
    const result = await closePurchaseOrder(po.id);
    if (result) {
      refetch();
    }
  };

  const handleDelete = async (po: PurchaseOrderListItem) => {
    const success = await deletePurchaseOrder(po.id);
    if (success) {
      refetch();
    }
  };

  const handleSave = () => {
    setDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PurchaseOrderHeader onCreatePurchaseOrder={handleCreate} />

      <PurchaseOrderFilters filters={filters} setFilters={setFilters} />

      <PurchaseOrderTable
        purchaseOrders={purchaseOrders}
        loading={loading || actionLoading}
        error={error}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onClose={handleClose}
        onDelete={handleDelete}
      />

      <PurchaseOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchaseOrder={selectedPurchaseOrder}
        onSave={handleSave}
      />

      <PurchaseOrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        purchaseOrder={selectedPurchaseOrder}
      />
    </div>
  );
}
