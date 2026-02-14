import { useState } from 'react';
import { useRFQs } from '../../hooks/useRFQs';
import { useRFQActions } from '../../hooks/useRFQActions';
import type { RFQListItem } from '../../types/rfq.types';

import {
  RFQHeader,
  RFQFilters,
  RFQTable,
  RFQDialog,
  RFQDetailDialog,
} from './index';

export function RFQManagement() {
  console.log('[RFQManagement] Component mounting');
  
  const {
    rfqs,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  } = useRFQs();

  console.log('[RFQManagement] State:', { rfqs, loading, error, totalCount });

  const {
    loading: actionLoading,
    sendRFQ,
    closeRFQ,
    deleteRFQ,
  } = useRFQActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedRFQId(null);
    setDialogOpen(true);
  };

  const handleEdit = (rfq: RFQListItem) => {
    if (rfq.status !== 'DRAFT') {
      return; // Only DRAFT can be edited
    }
    setSelectedRFQId(rfq.id);
    setDialogOpen(true);
  };

  const handleView = (rfq: RFQListItem) => {
    setSelectedRFQId(rfq.id);
    setDetailDialogOpen(true);
  };

  const handleSend = async (rfq: RFQListItem) => {
    const result = await sendRFQ(rfq.id);
    if (result) {
      refetch();
    }
  };

  const handleClose = async (rfq: RFQListItem) => {
    const result = await closeRFQ(rfq.id);
    if (result) {
      refetch();
    }
  };

  const handleDelete = async (rfq: RFQListItem) => {
    const success = await deleteRFQ(rfq.id);
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
      <RFQHeader onCreateRFQ={handleCreate} />

      <RFQFilters filters={filters} setFilters={setFilters} />

      <RFQTable
        rfqs={rfqs}
        loading={loading || actionLoading}
        error={error}
        totalCount={totalCount}
        filters={filters}
        setFilters={setFilters}
        onView={handleView}
        onEdit={handleEdit}
        onSend={handleSend}
        onClose={handleClose}
        onDelete={handleDelete}
      />

      <RFQDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rfqId={selectedRFQId}
        onSave={handleSave}
      />

      <RFQDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        rfqId={selectedRFQId}
      />
    </div>
  );
}
