import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';

import { useRFQManagement } from '../../hooks/useRFQManagement';

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
  } = useRFQManagement();

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading RFQs: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
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
      <RFQsTable
        rfqs={rfqs}
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
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <RFQDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} rfq={selectedRFQ} onEdit={handleEdit} />

      {/* Create/Edit Dialog */}
      <RFQDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} rfq={editRFQ} onSave={handleSave} saving={saving} />
    </div>
  );
}
