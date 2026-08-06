import * as React from 'react';

import { Plus, Loader2, Truck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import type { AsnOrder } from '../../types/asn-order.types';
import { useAsnOrderManagement } from '../../hooks/useAsnOrderManagement';
import { AsnOrdersTable } from '../advance stock notice/AsnOrdersTable';
import { AsnOrderDialog } from '../advance stock notice/AsnOrderDialog';

interface AsnManagementProps {
  warehouseId?: string;
}

export function AsnManagement({ warehouseId }: AsnManagementProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<AsnOrder | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = React.useState<AsnOrder | null>(null);

  const management = useAsnOrderManagement();

  // Sync warehouse filter from parent
  React.useEffect(() => {
    if (warehouseId) {
      management.setFilters((prev) => ({ ...prev, warehouse_id: warehouseId }));
    }
  }, [warehouseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    setSelectedOrder(null);
    setViewMode(false);
    setDialogOpen(true);
  };

  const handleView = (order: AsnOrder) => {
    setSelectedOrder(order);
    setViewMode(true);
    setDialogOpen(true);
  };

  const handleEdit = (order: AsnOrder) => {
    setSelectedOrder(order);
    setViewMode(false);
    setDialogOpen(true);
  };

  const handleDelete = (order: AsnOrder) => {
    setConfirmDeleteOrder(order);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    management.refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Advance Stock Notice</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage advance stock notice (ASN) orders to notify warehouses of incoming shipments.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New ASN Order
        </Button>
      </div>

      <AsnOrdersTable
        asnOrders={management.asnOrders}
        loading={management.loading}
        error={management.error}
        hasActiveFilters={!!management.filters.search || management.filters.status !== 'all'}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateOrder={handleCreate}
        serverPagination={management.serverPaginationConfig}
        recentlyCreatedId={management.recentlyCreatedId}
      />

      <AsnOrderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setDialogOpen(true);
        }}
        viewMode={viewMode}
        onSave={management.handleSave}
        saving={management.saving}
        asnOrder={selectedOrder}
      />

      {/* Delete confirmation */}
      {confirmDeleteOrder && (
        <DeleteConfirmDialog
          order={confirmDeleteOrder}
          onClose={() => setConfirmDeleteOrder(null)}
          onConfirm={async () => {
            if (confirmDeleteOrder?.id) {
              await management.deleteMutation.mutateAsync(confirmDeleteOrder.id);
              management.refetch();
            }
            setConfirmDeleteOrder(null);
          }}
        />
      )}
    </div>
  );
}

/** Simple delete confirmation inline component */
function DeleteConfirmDialog({
  order,
  onClose,
  onConfirm,
}: {
  order: AsnOrder;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Delete ASN Order</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete ASN order <strong>{order.asn_order_no}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
