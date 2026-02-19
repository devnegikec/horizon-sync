import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useQuotationManagement } from '../../hooks/useQuotationManagement';

import { PickListStats } from './PickListStats';
import { PickListManagementFilters } from './PickListManagementFilters';
import { PickListManagementHeader } from './PickListManagementHeader';
import { PickListTable } from './PickListTable';



export function PickListManagement() {
  const { toast } = useToast();
  const {
    filters,
    setFilters,
    quotations,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedQuotation,
    editQuotation,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConvert,
    handleConvertConfirm,
    convertDialogOpen,
    setConvertDialogOpen,
    converting,
    handleTableReady,
    handleSave,
    serverPaginationConfig,
  } = useQuotationManagement();

  console.log({selectedQuotation})

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading quotations: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <PickListManagementHeader onRefresh={refetch}
        onCreateQuotation={handleCreate}
        isLoading={loading}/>

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <PickListStats total={stats.total}
        draft={stats.draft}
        sent={stats.sent}
        accepted={stats.accepted}/>

      {/* Filters */}
      <PickListManagementFilters filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}/>

      {/* Quotations Table */}
      <PickListTable quotations={quotations}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConvert={handleConvert}
        onCreateQuotation={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>
    </div>
  );
}

