import * as React from 'react';

import { Truck, Package, Warehouse } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Separator,
  Textarea,
} from '@horizon-sync/ui/components';

import type { PickList } from '../../types/pick-list.types';

interface CreateDeliveryFromPickListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickList: PickList | null;
  onCreateDelivery: (
    data: { pick_list_id: string; delivery_date?: string; remarks?: string },
  ) => Promise<void>;
  creating: boolean;
}

export function CreateDeliveryFromPickListDialog({
  open,
  onOpenChange,
  pickList,
  onCreateDelivery,
  creating,
}: CreateDeliveryFromPickListDialogProps) {
  const [deliveryDate, setDeliveryDate] = React.useState('');
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setDeliveryDate('');
      setRemarks('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickList) return;

    await onCreateDelivery({
      pick_list_id: pickList.id,
      delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
      remarks: remarks || undefined,
    });
  };

  if (!pickList) return null;

  const canCreate = pickList.status === 'draft' || pickList.status === 'in_progress';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Truck className="h-5 w-5" />
            Create Delivery Note from Pick List
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pick List Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Pick List</p>
                <p className="font-semibold font-mono">{pickList.pick_list_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales Order</p>
                <p className="font-semibold font-mono">{pickList.sales_order_no || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{pickList.status}</p>
            </div>
          </div>

          {!canCreate && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Only pick lists in <span className="font-semibold">draft</span> or{' '}
                <span className="font-semibold">in progress</span> status can be converted to delivery notes.
              </p>
            </div>
          )}

          <Separator />

          {/* Items Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Items to Deliver</h3>
            <p className="text-sm text-muted-foreground">
              This will deduct stock, create audit movements, and mark the pick list as completed.
            </p>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(pickList.items ?? []).map((item, index) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {item.item_name || item.item_code || item.item_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {item.warehouse_name || item.warehouse_code || item.warehouse_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">{item.qty}</td>
                        <td className="px-4 py-3 text-sm">{item.uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Delivery Date (optional, defaults to now)</Label>
              <Input
                type="datetime-local"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks (optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Delivery notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !canCreate}>
              {creating ? 'Creating Delivery Note...' : 'Confirm & Create Delivery Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
