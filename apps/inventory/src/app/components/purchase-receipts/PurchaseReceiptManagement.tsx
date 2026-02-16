import { useState } from 'react';
import { usePurchaseReceipts } from '../../hooks/usePurchaseReceipts';
import { usePurchaseReceiptActions } from '../../hooks/usePurchaseReceiptActions';
import type { PurchaseReceipt, PurchaseReceiptListItem } from '../../types/purchase-receipt.types';

import {
  PurchaseReceiptHeader,
  PurchaseReceiptFilters,
  PurchaseReceiptTable,
  PurchaseReceiptDialog,
  PurchaseReceiptDetailDialog,
} from './index';

export function PurchaseReceiptManagement() {
  const {
    purchaseReceipts,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  } = usePurchaseReceipts();

  const {
    loading: actionLoading,
    createPurchaseReceipt,
  } = usePurchaseReceiptActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseReceipt | null>(null);

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleView = (receipt: PurchaseReceiptListItem) => {
    setSelectedReceipt(receipt as unknown as PurchaseReceipt);
    setDetailDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PurchaseReceiptHeader onCreateReceipt={handleCreate} />

      <PurchaseReceiptFilters filters={filters} setFilters={setFilters} />

      <PurchaseReceiptTable
        purchaseReceipts={purchaseReceipts}
        loading={loading || actionLoading}
        error={error}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
      />

      <PurchaseReceiptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />

      <PurchaseReceiptDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        purchaseReceipt={selectedReceipt}
      />
    </div>
  );
}
