import * as React from 'react';

import { Card, CardContent } from '@horizon-sync/ui/components';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';

import { useRFQManagement } from '../../hooks/useRFQManagement';
import { ErrorBanner } from '../common';

import {
  RFQHeader,
  RFQManagementFilters,
  RFQsTable,
  RFQDialog,
  RFQDetailDialog,
  RFQStats,
} from './index';

export function RFQManagement() {
  const {
    filters,
    setFilters,
    rfqs,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedRFQ,
    editRFQ,
    tableInstance,
    saving,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSend,
    handleClose,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
    confirmAction,
    setConfirmAction,
    executeConfirmedAction,
  } = useRFQManagement();

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return <ErrorBanner entity="RFQs" message={error} />;
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <RFQHeader onCreateRFQ={handleCreate} onRefresh={refetch} isLoading={loading} />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <RFQStats total={stats.total} draft={stats.draft} sent={stats.sent} responded={stats.responded} />

      {/* Filters */}
      <RFQManagementFilters filters={filters} setFilters={setFilters} tableInstance={tableInstance} />

      {/* RFQs Table */}
      <RFQsTable rfqs={rfqs}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || !!filters.status}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSend={handleSend}
        onClose={handleClose}
        onCreateRFQ={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Detail Dialog */}
      <RFQDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} rfq={selectedRFQ} onEdit={handleEdit} />

      {/* Create/Edit Dialog */}
      <RFQDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} rfq={editRFQ} onSave={handleSave} saving={saving} />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.title || ''}
        description={confirmAction?.message || ''}
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : confirmAction?.type === 'close' ? 'Close' : 'Send'}
        variant={confirmAction?.type === 'send' ? 'default' : 'destructive'}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}
