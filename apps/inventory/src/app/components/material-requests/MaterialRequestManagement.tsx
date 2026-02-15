import { useState } from 'react';
import { useMaterialRequests } from '../../hooks/useMaterialRequests';
import { useMaterialRequestActions } from '../../hooks/useMaterialRequestActions';
import type { MaterialRequest } from '../../types/material-requests.types';

import {
  MaterialRequestHeader,
  MaterialRequestFilters,
  MaterialRequestTable,
  MaterialRequestDialog,
  MaterialRequestDetailDialog,
} from './index';

export function MaterialRequestManagement() {
  console.log('[MaterialRequestManagement] Component mounting');
  
  const {
    materialRequests,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  } = useMaterialRequests();

  console.log('[MaterialRequestManagement] State:', { materialRequests, loading, error, totalCount });

  const {
    loading: actionLoading,
    submitMaterialRequest,
    cancelMaterialRequest,
    deleteMaterialRequest,
  } = useMaterialRequestActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMaterialRequest, setSelectedMaterialRequest] = useState<MaterialRequest | null>(null);

  const handleCreate = () => {
    setSelectedMaterialRequest(null);
    setDialogOpen(true);
  };

  const handleEdit = (mr: MaterialRequest) => {
    if (mr.status !== 'DRAFT') {
      return; // Only DRAFT can be edited
    }
    setSelectedMaterialRequest(mr);
    setDialogOpen(true);
  };

  const handleView = (mr: MaterialRequest) => {
    setSelectedMaterialRequest(mr);
    setDetailDialogOpen(true);
  };

  const handleSubmit = async (mr: MaterialRequest) => {
    const result = await submitMaterialRequest(mr.id);
    if (result) {
      refetch();
    }
  };

  const handleCancel = async (mr: MaterialRequest) => {
    const result = await cancelMaterialRequest(mr.id);
    if (result) {
      refetch();
    }
  };

  const handleDelete = async (mr: MaterialRequest) => {
    const success = await deleteMaterialRequest(mr.id);
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
      <MaterialRequestHeader onCreateMaterialRequest={handleCreate} />

      <MaterialRequestFilters filters={filters} setFilters={setFilters} />

      <MaterialRequestTable
        materialRequests={materialRequests}
        loading={loading || actionLoading}
        error={error}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      <MaterialRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        materialRequest={selectedMaterialRequest}
        onSave={handleSave}
      />

      <MaterialRequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        materialRequest={selectedMaterialRequest}
      />
    </div>
  );
}
