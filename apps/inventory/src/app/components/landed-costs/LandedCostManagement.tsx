import { useState } from 'react';

import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';

import { useLandedCostActions } from '../../hooks/useLandedCostActions';
import { useLandedCosts } from '../../hooks/useLandedCosts';
import type { LandedCostVoucherListItem } from '../../types/landed-cost.types';

import { LandedCostDetailDialog } from './LandedCostDetailDialog';
import { LandedCostDialog } from './LandedCostDialog';
import { LandedCostFilters } from './LandedCostFilters';
import { LandedCostHeader } from './LandedCostHeader';
import { LandedCostTable } from './LandedCostTable';


export function LandedCostManagement() {
  const { landedCosts, loading, error, totalCount, filters, setFilters, refetch } = useLandedCosts();
  const { loading: actionLoading, createLandedCost, updateLandedCost, deleteLandedCost } = useLandedCostActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<LandedCostVoucherListItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const success = await deleteLandedCost(confirmDeleteId);
    if (success) {
      refetch();
    }
    setConfirmDeleteId(null);
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

      <LandedCostTable landedCosts={landedCosts}
        loading={loading}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}/>

      <LandedCostDialog open={dialogOpen}
        onClose={handleDialogClose}
        voucher={selectedVoucher}
        editMode={editMode}
        createLandedCost={createLandedCost}
        updateLandedCost={updateLandedCost}
        loading={actionLoading}/>

      <LandedCostDetailDialog open={detailDialogOpen}
        onClose={handleDetailDialogClose}
        voucherId={selectedVoucher?.id}/>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Delete Landed Cost Voucher"
        description="Are you sure you want to delete this landed cost voucher?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDelete}
      />
    </div>
  );
}
