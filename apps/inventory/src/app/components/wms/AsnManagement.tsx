import * as React from 'react';

import { Plus, RefreshCw, RotateCcw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { DatePicker, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useAsnOrderManagement } from '../../hooks/useAsnOrderManagement';
import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import type { AsnOrder } from '../../types/asn-order.types';
import { hasPermission } from '../../utils/permissions';
import { AsnOrderDialog } from '../advance stock notice/AsnOrderDialog';
import { AsnOrdersTable } from '../advance stock notice/AsnOrdersTable';
import { AsnStats } from '../advance stock notice/AsnStats';
import { AsnVehicleDialog } from '../advance stock notice/AsnVehicleDialog';
import { CloseAsnOrderDialog } from '../advance stock notice/CloseAsnOrderDialog';

interface AsnManagementProps {
  warehouseId?: string;
}

/** True when any work-queue filter (source warehouse, ETA range, vehicle) is set. */
function hasActiveWorkQueueFilters(filters: {
  source_warehouse_id: string;
  delivery_date_from: string;
  delivery_date_to: string;
  vehicle_no: string;
}): boolean {
  return (
    !!filters.source_warehouse_id ||
    !!filters.delivery_date_from ||
    !!filters.delivery_date_to ||
    !!filters.vehicle_no
  );
}

function getRefreshIconClass(isLoading: boolean): string {
  return isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4';
}

/**
 * Scope the vehicle picker to the ASN's target warehouse when the page itself
 * was not given one.
 */
function resolveVehicleWarehouseId(pageWarehouseId: string | undefined, target: AsnOrder | null): string | undefined {
  return pageWarehouseId ?? (target?.warehouse_id_to || undefined);
}

export function AsnManagement({ warehouseId }: AsnManagementProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<AsnOrder | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = React.useState<AsnOrder | null>(null);
  // Short-delivery closure and vehicle attachment are separate flows from the
  // create/edit dialog, so they carry their own target order.
  const [closeTarget, setCloseTarget] = React.useState<AsnOrder | null>(null);
  const [vehicleTarget, setVehicleTarget] = React.useState<AsnOrder | null>(null);

  const { toast } = useToast();
  const management = useAsnOrderManagement();
  const { warehouses } = useMyWarehouses();
  const userPermissions = useUserStore((s) => s.permissions.permissions);
  // Closing is an `asn_order.update` action; without it the row menu hides the
  // action entirely (and the API would answer 403 anyway).
  const canCloseAsn = hasPermission(userPermissions, 'asn_order.update');

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

  const handleClosed = (closed: AsnOrder) => {
    toast({
      title: 'ASN closed',
      description: closed.short_closed
        ? `${closed.asn_order_no} was closed with an accepted shortfall.`
        : `${closed.asn_order_no} was closed.`,
    });
  };

  const handleCloseTargetChange = React.useCallback((open: boolean) => {
    if (!open) setCloseTarget(null);
  }, []);

  const handleVehicleTargetChange = React.useCallback((open: boolean) => {
    if (!open) setVehicleTarget(null);
  }, []);

  const handleResetFilters = () => {
    management.setFilters((prev) => ({
      ...prev,
      source_warehouse_id: '',
      delivery_date_from: '',
      delivery_date_to: '',
      vehicle_no: '',
    }));
  };

  const hasWorkQueueFilters = hasActiveWorkQueueFilters(management.filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Advance Stock Notice</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage advance stock notice (ASN) orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button"
            variant="outline"
            onClick={() => management.refetch()}
            disabled={management.loading}
            className="gap-2">
            <RefreshCw className={getRefreshIconClass(management.loading)} />
            Refresh
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New ASN Order
          </Button>
        </div>
      </div>

      <AsnStats counts={management.statusCounts} />

      {/* Work-queue filters: source warehouse, ETA, vehicle */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Source Warehouse</Label>
          <Select value={management.filters.source_warehouse_id || 'all'}
            onValueChange={(v) =>
              management.setFilters((prev) => ({ ...prev, source_warehouse_id: v === 'all' ? '' : v }))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">ETA From</Label>
          <DatePicker className="w-[160px]"
            value={management.filters.delivery_date_from}
            onChange={(value) =>
              management.setFilters((prev) => ({ ...prev, delivery_date_from: value }))} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">ETA To</Label>
          <DatePicker className="w-[160px]"
            value={management.filters.delivery_date_to}
            onChange={(value) =>
              management.setFilters((prev) => ({ ...prev, delivery_date_to: value }))} />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Vehicle No</Label>
          <Input className="w-[180px]"
            placeholder="e.g., KA01AB1234"
            value={management.filters.vehicle_no}
            onChange={(e) =>
              management.setFilters((prev) => ({ ...prev, vehicle_no: e.target.value }))} />
        </div>

        <Button type="button"
          variant="outline"
          onClick={handleResetFilters}
          disabled={!hasWorkQueueFilters}
          className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <AsnOrdersTable asnOrders={management.asnOrders}
        loading={management.loading}
        error={management.error}
        hasActiveFilters={!!management.filters.search || management.filters.status !== 'all' || !!management.filters.vehicle_no || !!management.filters.source_warehouse_id || !!management.filters.delivery_date_from || !!management.filters.delivery_date_to}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCloseAsn={canCloseAsn ? setCloseTarget : undefined}
        onManageVehicles={setVehicleTarget}
        onCreateOrder={handleCreate}
        serverPagination={management.serverPaginationConfig}
        recentlyCreatedId={management.recentlyCreatedId} />

      <AsnOrderDialog open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setDialogOpen(true);
        }}
        viewMode={viewMode}
        onSave={management.handleSave}
        saving={management.saving}
        asnOrder={selectedOrder} />

      {/* Delete confirmation */}
      {confirmDeleteOrder && (
        <DeleteConfirmDialog order={confirmDeleteOrder}
          onClose={() => setConfirmDeleteOrder(null)}
          onConfirm={async () => {
            if (confirmDeleteOrder?.id) {
              await management.deleteMutation.mutateAsync(confirmDeleteOrder.id);
              management.refetch();
            }
            setConfirmDeleteOrder(null);
          }} />
      )}

      {/* Short-delivery closure */}
      <CloseAsnOrderDialog order={closeTarget}
        onOpenChange={handleCloseTargetChange}
        onClose={management.closeOrder}
        onClosed={handleClosed}
        onStale={() => management.refetch()} />

      {/* Vehicle attachment */}
      <AsnVehicleDialog order={vehicleTarget}
        warehouseId={resolveVehicleWarehouseId(warehouseId, vehicleTarget)}
        onOpenChange={handleVehicleTargetChange}
        onChanged={() => management.refetch()} />
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
