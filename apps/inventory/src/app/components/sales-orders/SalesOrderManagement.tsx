import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { Button, Card, CardContent } from '@horizon-sync/ui/components';

import { useSalesOrderManagement } from '../../hooks/useSalesOrderManagement';

import { SalesOrderDetailDialog } from './SalesOrderDetailDialog';
import { SalesOrderDialog } from './SalesOrderDialog';
import { SalesOrdersTable } from './SalesOrdersTable';
import { SalesOrderManagementHeader } from './SalesOrderManagementHeader';
import { SalesOrderStats } from './SalesOrderStats';
import { SalesOrderManagementFilters } from './SalesOrderManagementFilters';
import { CreateInvoiceDialog } from './CreateInvoiceDialog';

export function SalesOrderManagement({
  pendingSalesOrderId,
  onClearPendingSalesOrderId,
  onNavigateToInvoice,
}: {
  pendingSalesOrderId?: string | null;
  onClearPendingSalesOrderId?: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}) {
  const { toast } = useToast();
  const {
    filters,
    setFilters,
    salesOrders,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    invoiceDialogOpen,
    setInvoiceDialogOpen,
    selectedSalesOrder,
    editSalesOrder,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCreateInvoice,
    handleTableReady,
    handleSave,
    handleConvertToInvoice,
    serverPaginationConfig,
  } = useSalesOrderManagement();

  const [saving, setSaving] = React.useState(false);
  const [creatingInvoice, setCreatingInvoice] = React.useState(false);

  // Handle pending sales order ID from cross-document navigation
  React.useEffect(() => {
    if (pendingSalesOrderId) {
      // Find the sales order and open its detail dialog
      const salesOrder = salesOrders.find(so => so.id === pendingSalesOrderId);
      if (salesOrder) {
        handleView(salesOrder);
      }
      onClearPendingSalesOrderId?.();
    }
  }, [pendingSalesOrderId, salesOrders, handleView, onClearPendingSalesOrderId]);

  const handleSaveWrapper = React.useCallback(async (data: Parameters<typeof handleSave>[0], id?: string) => {
    setSaving(true);
    try {
      await handleSave(data, id);
    } finally {
      setSaving(false);
    }
  }, [handleSave]);

  const handleConvertToInvoiceWrapper = React.useCallback(async (salesOrderId: string, data: Parameters<typeof handleConvertToInvoice>[1]) => {
    setCreatingInvoice(true);
    try {
      await handleConvertToInvoice(salesOrderId, data);
    } finally {
      setCreatingInvoice(false);
    }
  }, [handleConvertToInvoice]);

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading sales orders: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <SalesOrderManagementHeader
        onRefresh={refetch}
        onCreateSalesOrder={handleCreate}
        isLoading={loading}
      />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <SalesOrderStats
        total={stats.total}
        confirmed={stats.confirmed}
        confirmedValue={stats.confirmedValue}
        pendingDelivery={stats.pendingDelivery}
      />

      {/* Filters */}
      <SalesOrderManagementFilters
        filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}
      />

      {/* Sales Orders Table */}
      <SalesOrdersTable
        salesOrders={salesOrders}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateSalesOrder={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <SalesOrderDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        salesOrder={selectedSalesOrder}
        onEdit={handleEdit}
        onCreateInvoice={handleCreateInvoice}
        onViewInvoice={(invoiceId) => {
          setDetailDialogOpen(false);
          onNavigateToInvoice?.(invoiceId);
        }}
      />

      {/* Create/Edit Dialog */}
      <SalesOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        salesOrder={editSalesOrder}
        onSave={handleSaveWrapper}
        saving={saving}
      />

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        salesOrder={selectedSalesOrder}
        onCreateInvoice={handleConvertToInvoiceWrapper}
        creating={creatingInvoice}
      />
    </div>
  );
}
