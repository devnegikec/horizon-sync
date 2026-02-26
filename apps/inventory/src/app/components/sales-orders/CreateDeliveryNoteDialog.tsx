import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Truck, AlertCircle, Package } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@horizon-sync/ui/components';

import type { SalesOrder } from '../../types/sales-order.types';
import type { Warehouse, WarehousesResponse } from '../../types/warehouse.types';
import { warehouseApi } from '../../utility/api/warehouses';

interface DeliveryLineItem {
  item_id: string;
  item_name: string;
  ordered_qty: number;
  delivered_qty: number;
  pending_qty: number;
  qty_to_deliver: number;
  warehouse_id: string;
  uom: string;
  rate: number;
}

interface CreateDeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onCreateDeliveryNote: (
    salesOrderId: string,
    data: { items: { item_id: string; qty_to_deliver: number; warehouse_id: string }[] },
  ) => Promise<void>;
  creating: boolean;
}

export function CreateDeliveryNoteDialog({
  open,
  onOpenChange,
  salesOrder,
  onCreateDeliveryNote,
  creating,
}: CreateDeliveryNoteDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [lineItems, setLineItems] = React.useState<DeliveryLineItem[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = React.useState('');

  const { data: warehousesData } = useQuery<WarehousesResponse>({
    queryKey: ['warehouses-list'],
    queryFn: () => warehouseApi.list(accessToken || '', 1, 100) as Promise<WarehousesResponse>,
    enabled: !!accessToken && open,
  });

  const warehouses: Warehouse[] = React.useMemo(() => {
    return (warehousesData?.warehouses ?? []).filter((w) => w.is_active);
  }, [warehousesData]);

  // Set default warehouse when warehouses load
  React.useEffect(() => {
    if (warehouses.length > 0 && !defaultWarehouseId) {
      const defaultWh = warehouses.find((w) => w.is_default);
      setDefaultWarehouseId(defaultWh?.id || warehouses[0].id);
    }
  }, [warehouses, defaultWarehouseId]);

  // Initialize line items when dialog opens
  React.useEffect(() => {
    if (open && salesOrder?.items && defaultWarehouseId) {
      setLineItems(
        salesOrder.items.map((item) => {
          const ordered = Number(item.qty);
          const delivered = Number(item.delivered_qty);
          const pending = Math.max(ordered - delivered, 0);
          return {
            item_id: item.item_id,
            item_name: item.item_name || item.item_id,
            ordered_qty: ordered,
            delivered_qty: delivered,
            pending_qty: pending,
            qty_to_deliver: pending,
            warehouse_id: defaultWarehouseId,
            uom: item.uom,
            rate: Number(item.rate),
          };
        }),
      );
    }
  }, [open, salesOrder, defaultWarehouseId]);

  const handleQtyChange = (index: number, value: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty_to_deliver: value };
      return updated;
    });
  };

  const handleWarehouseChange = (index: number, warehouseId: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], warehouse_id: warehouseId };
      return updated;
    });
  };

  const handleSetAllWarehouse = (warehouseId: string) => {
    setDefaultWarehouseId(warehouseId);
    setLineItems((prev) => prev.map((item) => ({ ...item, warehouse_id: warehouseId })));
  };

  // Group items by warehouse to show how many delivery notes will be created
  const warehouseGroups = React.useMemo(() => {
    const groups = new Map<string, { warehouse: Warehouse | undefined; items: DeliveryLineItem[] }>();
    for (const item of lineItems) {
      if (item.qty_to_deliver <= 0) continue;
      const existing = groups.get(item.warehouse_id);
      const wh = warehouses.find((w) => w.id === item.warehouse_id);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.warehouse_id, { warehouse: wh, items: [item] });
      }
    }
    return groups;
  }, [lineItems, warehouses]);

  const deliveryNoteCount = warehouseGroups.size;
  const hasValidItems = lineItems.some((item) => item.qty_to_deliver > 0);
  const hasValidationError = lineItems.some(
    (item) => item.qty_to_deliver > item.pending_qty || item.qty_to_deliver < 0,
  );
  const hasMissingWarehouse = lineItems.some(
    (item) => item.qty_to_deliver > 0 && !item.warehouse_id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesOrder) return;
    if (hasValidationError) return;
    if (!hasValidItems) return;
    if (hasMissingWarehouse) return;

    const items = lineItems
      .filter((item) => item.qty_to_deliver > 0)
      .map((item) => ({
        item_id: item.item_id,
        qty_to_deliver: item.qty_to_deliver,
        warehouse_id: item.warehouse_id,
      }));

    await onCreateDeliveryNote(salesOrder.id, { items });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!salesOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-5 w-5" />
            Create Delivery Note from Sales Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sales Order Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Sales Order</p>
                <p className="font-semibold">{salesOrder.sales_order_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{salesOrder.customer_name || salesOrder.customer_id}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium">
                  {salesOrder.delivery_date ? formatDate(salesOrder.delivery_date) : 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Default Warehouse Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Default Warehouse for All Items</p>
              <Select value={defaultWarehouseId} onValueChange={handleSetAllWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code}){wh.is_default ? ' ★' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                You can override the warehouse per item below
              </p>
            </div>
          </div>

          <Separator />

          {/* Line Items Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Quantities to Deliver</h3>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Ordered</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Pending</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Qty to Deliver</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((item, index) => {
                      const isOverDelivered = item.qty_to_deliver > item.pending_qty;
                      const isFullyDelivered = item.pending_qty === 0;

                      return (
                        <tr
                          key={item.item_id}
                          className={
                            isOverDelivered
                              ? 'bg-red-50 dark:bg-red-950/20'
                              : isFullyDelivered
                                ? 'bg-muted/30 opacity-60'
                                : ''
                          }
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {item.item_name}
                              {isFullyDelivered && (
                                <Badge variant="secondary" className="text-xs">
                                  Fully Delivered
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{item.ordered_qty}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.delivered_qty}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{item.pending_qty}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.pending_qty}
                              step="1"
                              value={item.qty_to_deliver}
                              onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                              className={`w-24 text-right ml-auto ${isOverDelivered ? 'border-red-500' : ''}`}
                              disabled={isFullyDelivered}
                            />
                            {isOverDelivered && (
                              <p className="text-xs text-red-500 mt-1">Exceeds pending</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Select
                              value={item.warehouse_id}
                              onValueChange={(v) => handleWarehouseChange(index, v)}
                              disabled={isFullyDelivered}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((wh) => (
                                  <SelectItem key={wh.id} value={wh.id}>
                                    {wh.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Delivery Note Preview */}
          {hasValidItems && !hasValidationError && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Delivery Note Preview
              </h3>
              {deliveryNoteCount > 1 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Items are assigned to {deliveryNoteCount} different warehouses. This will create{' '}
                    <span className="font-semibold">{deliveryNoteCount} delivery notes</span>, one per
                    warehouse.
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {Array.from(warehouseGroups.entries()).map(([whId, group]) => (
                  <div key={whId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {group.warehouse?.name || whId} ({group.warehouse?.code || ''})
                      </span>
                      <Badge variant="outline">{group.items.length} item(s)</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {group.items.map((item) => (
                        <div key={item.item_id} className="flex justify-between">
                          <span>{item.item_name}</span>
                          <span>
                            {item.qty_to_deliver} {item.uom}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !hasValidItems || hasValidationError || hasMissingWarehouse}
            >
              {creating
                ? 'Creating...'
                : deliveryNoteCount > 1
                  ? `Create ${deliveryNoteCount} Delivery Notes`
                  : 'Create Delivery Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
