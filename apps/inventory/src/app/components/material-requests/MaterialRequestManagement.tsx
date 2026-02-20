import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';

import { useMaterialRequestManagement } from '../../hooks/useMaterialRequestManagement';

import {
  MaterialRequestHeader,
  MaterialRequestFilters,
  MaterialRequestsTable,
  MaterialRequestDialog,
  MaterialRequestDetailDialog,
  MaterialRequestStats,
} from './index';

export function MaterialRequestManagement() {
  const {
    filters,
    setFilters,
    materialRequests,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedMaterialRequest,
    editMaterialRequest,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleCancel,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  } = useMaterialRequestManagement();

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading material requests: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <MaterialRequestHeader
        onRefresh={refetch}
        onCreateMaterialRequest={handleCreate}
        isLoading={loading}
      />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <MaterialRequestStats
        total={stats.total}
        draft={stats.draft}
        submitted={stats.submitted}
        quoted={stats.quoted}
      />

      {/* Filters */}
      <MaterialRequestFilters
        filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}
      />

      {/* Material Requests Table */}
      <MaterialRequestsTable
        materialRequests={materialRequests}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onCreateMaterialRequest={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <MaterialRequestDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        materialRequest={selectedMaterialRequest}
      />

      {/* Create/Edit Dialog */}
      <MaterialRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        materialRequest={editMaterialRequest}
        onSave={handleSave}
      />
    </div>
  );
}
