import * as React from 'react';
import { Edit, FileText, ShoppingCart, Receipt } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { SalesOrder } from '../../types/sales-order.types';
import { StatusBadge } from '../quotations/StatusBadge';

interface SalesOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onEdit: (salesOrder: SalesOrder) => void;
  onCreateInvoice: (salesOrder: SalesOrder) => void;
}

export function SalesOrderDetailDialog({ open, onOpenChange, salesOrder, onEdit, onCreateInvoice }: SalesOrderDetailDialogProps) {
  if (!salesOrder) return null;

  const isClosedOrCancelled = salesOrder.status === 'closed' || salesOrder.status === 'cancelled';
  const canCreateInvoice = salesOrder.status === 'confirmed' || salesOrder.status === 'partially_delivered' || salesOrder.status === 'delivered';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              Sales Order Details
            </DialogTitle>
            <StatusBadge status={salesOrder.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Sales Order Number</p>
              <p className="text-lg font-semibold">{salesOrder.sales_order_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-lg font-semibold">{salesOrder.customer_name || salesOrder.customer_id}</p>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Date</p>
              <p className="font-medium">{salesOrder.delivery_date ? formatDate(salesOrder.delivery_date) : 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{salesOrder.currency}</p>
            </div>
          </div>

          {/* Reference */}
          {salesOrder.reference_type === 'Quotation' && salesOrder.reference_id && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100">
                  Created from Quotation (Ref: {salesOrder.reference_id.slice(0, 8)}...)
                </span>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold">{salesOrder.currency} {Number(salesOrder.grand_total).toFixed(2)}</span>
            </div>
          </div>

          {/* Line Items with Fulfillment Status */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {salesOrder.items && salesOrder.items.length > 0 ? (
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Billed</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {salesOrder.items.map((item, index) => {
                        const qty = Number(item.qty);
                        const billedQty = Number(item.billed_qty);
                        const deliveredQty = Number(item.delivered_qty);
                        const billedPct = qty > 0 ? Math.min((billedQty / qty) * 100, 100) : 0;
                        const deliveredPct = qty > 0 ? Math.min((deliveredQty / qty) * 100, 100) : 0;

                        return (
                          <tr key={item.id || index}>
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3 text-sm">{item.item_name || item.item_id}</td>
                            <td className="px-4 py-3 text-sm text-right">{qty}</td>
                            <td className="px-4 py-3 text-sm">{item.uom}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.rate).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{Number(item.amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span>{billedQty} / {qty}</span>
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${billedPct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span>{deliveredQty} / {qty}</span>
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${deliveredPct}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items</p>
            )}
          </div>

          {/* Remarks */}
          {salesOrder.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{salesOrder.remarks}</p>
            </div>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(salesOrder.created_at)}</p>
            </div>
            {salesOrder.updated_at && (
              <div>
                <p>Updated: {formatDate(salesOrder.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canCreateInvoice && (
            <Button variant="default" onClick={() => onCreateInvoice(salesOrder)} className="gap-2">
              <Receipt className="h-4 w-4" />
              Create Invoice
            </Button>
          )}
          {!isClosedOrCancelled && (
            <Button variant="default" onClick={() => onEdit(salesOrder)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
