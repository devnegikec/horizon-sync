import { useState } from 'react';
import { useLandedCosts } from '../../hooks/useLandedCosts';
import { useLandedCostActions } from '../../hooks/useLandedCostActions';
import { LandedCostHeader } from './LandedCostHeader';
import { LandedCostFilters } from './LandedCostFilters';
import { LandedCostTable } from './LandedCostTable';
import { LandedCostDialog } from './LandedCostDialog';
import { LandedCostDetailDialog } from './LandedCostDetailDialog';
import type { LandedCostVoucherListItem } from '../../types/landed-cost.types';

export function LandedCostManagement() {
  const { landedCosts, loading, error, totalCount, filters, setFilters, refetch } = useLandedCosts();
  const { loading: actionLoading, createLandedCost, updateLandedCost, deleteLandedCost } = useLandedCostActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<LandedCostVoucherListItem | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleCreate = () => {
    setSelectedVoucher(null);
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEdit = (voucher: LandedCostVoucherListItem) => {
    setSelectedVoucher(voucher);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleView = (voucher: LandedCostVoucherListItem) => {
    setSelectedVoucher(voucher);
    setDetailDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this landed cost voucher?')) {
      const success = await deleteLandedCost(id);
      if (success) {
        refetch();
      }
    }
  };

  const handleDialogClose = (shouldRefetch?: boolean) => {
    setDialogOpen(false);
    setSelectedVoucher(null);
    setEditMode(false);
    if (shouldRefetch) {
      refetch();
    }
  };

  const handleDetailDialogClose = () => {
    setDetailDialogOpen(false);
    setSelectedVoucher(null);
  };

  return (
    <div className="space-y-6">
      <LandedCostHeader onCreateVoucher={handleCreate} />
      
      <LandedCostFilters filters={filters} setFilters={setFilters} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <LandedCostTable
        landedCosts={landedCosts}
        loading={loading}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <LandedCostDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        voucher={selectedVoucher}
        editMode={editMode}
        createLandedCost={createLandedCost}
        updateLandedCost={updateLandedCost}
        loading={actionLoading}
      />

      <LandedCostDetailDialog
        open={detailDialogOpen}
        onClose={handleDetailDialogClose}
        voucherId={selectedVoucher?.id}
      />
    </div>
  );
}
