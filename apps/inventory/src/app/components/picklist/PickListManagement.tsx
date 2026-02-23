import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';

import { usePickListManagement } from '../../hooks/usePickListManagement';

import { PickListDetailDialog } from './PickListDetailDialog';
import { PickListManagementFilters } from './PickListManagementFilters';
import { PickListManagementHeader } from './PickListManagementHeader';
import { PickListStats } from './PickListStats';
import { PickListTable } from './PickListTable';

export function PickListManagement() {
  const {
    filters,
    setFilters,
    pickLists,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedPickList,
    tableInstance,
    handleView,
    handleDelete,
    handleTableReady,
    serverPaginationConfig,
  } = usePickListManagement();

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading pick lists: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <PickListManagementHeader onRefresh={refetch} isLoading={loading} />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <PickListStats total={stats.total}
        draft={stats.draft}
        inProgress={stats.inProgress}
        completed={stats.completed}/>

      {/* Filters */}
      <PickListManagementFilters filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}/>

      {/* Pick Lists Table */}
      <PickListTable pickLists={pickLists}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onDelete={handleDelete}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Detail Dialog */}
      <PickListDetailDialog open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        pickList={selectedPickList}/>
    </div>
  );
}

