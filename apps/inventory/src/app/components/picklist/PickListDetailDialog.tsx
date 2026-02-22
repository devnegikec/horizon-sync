import * as React from 'react';

import { Package, FileText, Warehouse } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { PickList } from '../../types/pick-list.types';
import { formatDate } from '../../utility/formatDate';

import { PickListStatusBadge } from './PickListStatusBadge';

interface PickListDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickList: PickList | null;
}

export function PickListDetailDialog({ open, onOpenChange, pickList }: PickListDetailDialogProps) {
  if (!pickList) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              Pick List Details
            </DialogTitle>
            <PickListStatusBadge status={pickList.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Pick List Number</p>
              <p className="text-lg font-semibold font-mono">{pickList.pick_list_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Order</p>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg font-semibold font-mono">{pickList.sales_order_no || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(pickList.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
            </div>
            {pickList.updated_at && (
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="font-medium">{formatDate(pickList.updated_at, 'DD-MMM-YY', { includeTime: true })}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Items to Pick</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Picked</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pickList.items?.map((item, index) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.item_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.warehouse_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{item.qty}</td>
                      <td className="px-4 py-3 text-right text-sm">{item.picked_qty || 0}</td>
                      <td className="px-4 py-3 text-sm">{item.uom}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks */}
          {pickList.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{pickList.remarks}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
