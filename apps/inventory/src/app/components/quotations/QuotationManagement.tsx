import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import { useQuotationManagement } from '../../hooks/useQuotationManagement';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { Button, Card, CardContent } from '@horizon-sync/ui/components';

import { QuotationDetailDialog } from './QuotationDetailDialog';
import { QuotationDialog } from './QuotationDialog';
import { QuotationsTable } from './QuotationsTable';
import { QuotationManagementHeader } from './QuotationManagementHeader';
import { QuotationStats } from './QuotationStats';
import { QuotationManagementFilters } from './QuotationManagementFilters';
import { ConvertToSalesOrderDialog } from './ConvertToSalesOrderDialog';

export function QuotationManagement() {
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
      <QuotationManagementHeader
        onRefresh={refetch}
        onCreateQuotation={handleCreate}
        isLoading={loading}
      />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <QuotationStats
        total={stats.total}
        draft={stats.draft}
        sent={stats.sent}
        accepted={stats.accepted}
      />

      {/* Filters */}
      <QuotationManagementFilters
        filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}
      />

      {/* Quotations Table */}
      <QuotationsTable
        quotations={quotations}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateQuotation={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <QuotationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        quotation={selectedQuotation}
        onEdit={handleEdit}
        onConvert={handleConvert}
      />

      {/* Create/Edit Dialog */}
      <QuotationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        quotation={editQuotation}
        onSave={handleSave}
        saving={false}
      />

      {/* Convert to Sales Order Dialog */}
      <ConvertToSalesOrderDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        quotation={selectedQuotation}
        onConvert={handleConvertConfirm}
        converting={converting}
      />
    </div>
  );
}

