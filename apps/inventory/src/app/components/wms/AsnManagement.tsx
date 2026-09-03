import * as React from 'react';

import { Plus, Loader2, Truck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger } from '@horizon-sync/ui/components';

import { useAsnOrderManagement } from '../../hooks/useAsnOrderManagement';
import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import type { AsnOrder } from '../../types/asn-order.types';
import { AsnOrderDialog } from '../advance stock notice/AsnOrderDialog';
import { AsnOrdersTable } from '../advance stock notice/AsnOrdersTable';

interface AsnManagementProps {
  warehouseId?: string;
}

export function AsnManagement({ warehouseId }: AsnManagementProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<AsnOrder | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = React.useState<AsnOrder | null>(null);
  const [activeTab, setActiveTab] = React.useState<'purchase' | 'internal_transfer' | 'stock_receipt'>('purchase');

  const management = useAsnOrderManagement();
  const { warehouses } = useMyWarehouses();

  // Sync warehouse filter from parent
  React.useEffect(() => {
    if (warehouseId) {
      management.setFilters((prev) => ({ ...prev, warehouse_id: warehouseId }));
    }
  }, [warehouseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync the ASN type filter from the active tab
  React.useEffect(() => {
    management.setFilters((prev) => ({ ...prev, asn_type: activeTab }));
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {activeTab === 'internal_transfer'
              ? 'Create internal stock transfers between your warehouses and track unit-level serials in transit.'
              : activeTab === 'stock_receipt'
                ? 'Create stock receipt ASNs for stock transferred from manufacturing units into the mother warehouse.'
                : 'Create and manage advance stock notice (ASN) orders to notify warehouses of incoming shipments.'}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {activeTab === 'internal_transfer'
            ? 'New Internal Transfer'
            : activeTab === 'stock_receipt'
              ? 'New Stock Receipt'
              : 'New ASN Order'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purchase' | 'internal_transfer' | 'stock_receipt')} className="w-full">
        <TabsList>
          <TabsTrigger value="purchase">Purchase ASN</TabsTrigger>
          <TabsTrigger value="internal_transfer">Internal Transfer</TabsTrigger>
          <TabsTrigger value="stock_receipt">Stock Receipt</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Work-queue filters: source warehouse, ETA, vehicle */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Source Warehouse</Label>
          <Select
            value={management.filters.source_warehouse_id || 'all'}
            onValueChange={(v) =>
              management.setFilters((prev) => ({ ...prev, source_warehouse_id: v === 'all' ? '' : v }))
            }
          >
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
          <Input
            type="date"
            className="w-[160px]"
            value={management.filters.delivery_date_from}
            onChange={(e) =>
              management.setFilters((prev) => ({ ...prev, delivery_date_from: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">ETA To</Label>
          <Input
            type="date"
            className="w-[160px]"
            value={management.filters.delivery_date_to}
            onChange={(e) =>
              management.setFilters((prev) => ({ ...prev, delivery_date_to: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Vehicle No</Label>
          <Input
            className="w-[180px]"
            placeholder="e.g., KA01AB1234"
            value={management.filters.vehicle_no}
            onChange={(e) =>
              management.setFilters((prev) => ({ ...prev, vehicle_no: e.target.value }))
            }
          />
        </div>
      </div>

      <AsnOrdersTable asnOrders={management.asnOrders}
        loading={management.loading}
        error={management.error}
        hasActiveFilters={!!management.filters.search || management.filters.status !== 'all' || !!management.filters.vehicle_no || !!management.filters.source_warehouse_id || !!management.filters.delivery_date_from || !!management.filters.delivery_date_to}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
        asnOrder={selectedOrder}
        defaultAsnType={activeTab} />

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
