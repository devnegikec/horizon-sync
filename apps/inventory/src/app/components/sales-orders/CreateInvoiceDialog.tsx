import * as React from 'react';

import { Receipt } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { SalesOrder, ConvertToInvoiceRequest, ConvertToInvoiceItemRequest } from '../../types/sales-order.types';

import { BankAccountDetails } from '../invoices/BankAccountDetails';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onCreateInvoice: (salesOrderId: string, data: ConvertToInvoiceRequest) => Promise<void>;
  creating: boolean;
}

export function CreateInvoiceDialog({ open, onOpenChange, salesOrder, onCreateInvoice, creating }: CreateInvoiceDialogProps) {
  const [lineItems, setLineItems] = React.useState<{ 
    item_id: string; 
    qty_to_bill: number; 
    max_qty: number; 
    item_name: string; 
    rate: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
  }[]>([]);

  React.useEffect(() => {
    if (open && salesOrder?.items) {
      setLineItems(
        salesOrder.items.map((item) => {
          const qty = Number(item.qty);
          const billedQty = Number(item.billed_qty);
          const available = Math.max(qty - billedQty, 0);
          return {
            item_id: item.item_id,
            qty_to_bill: available,
            max_qty: available,
            item_name: item.item_name || item.item_id,
            rate: Number(item.rate),
            discount_amount: Number(item.discount_amount || 0),
            tax_amount: Number(item.tax_amount || 0),
            total_amount: Number(item.total_amount || item.amount || 0),
          };
        })
      );
    }
  }, [open, salesOrder]);

  const invoiceTotals = React.useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    lineItems.forEach((item) => {
      if (item.qty_to_bill > 0) {
        const soItem = salesOrder?.items.find(i => i.item_id === item.item_id);
        if (soItem) {
          const originalQty = Number(soItem.qty);
          const proportion = originalQty > 0 ? item.qty_to_bill / originalQty : 1;
          
          const lineSubtotal = item.qty_to_bill * item.rate;
          const lineDiscount = item.discount_amount * proportion;
          const lineTax = item.tax_amount * proportion;
          
          subtotal += lineSubtotal;
          totalDiscount += lineDiscount;
          totalTax += lineTax;
        }
      }
    });
    
    const grandTotal = subtotal - totalDiscount + totalTax;
    
    return {
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
    };
  }, [lineItems, salesOrder]);

  const hasValidItems = lineItems.some((item) => item.qty_to_bill > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salesOrder) return;

    if (!hasValidItems) {
      alert('At least one line item must have a quantity to bill');
      return;
    }

    const items: ConvertToInvoiceItemRequest[] = lineItems
      .filter((item) => item.qty_to_bill > 0)
      .map((item) => ({
        item_id: item.item_id,
        qty_to_bill: item.qty_to_bill,
      }));

    await onCreateInvoice(salesOrder.id, { items });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Receipt className="h-5 w-5" />
            Create Invoice from Sales Order
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
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="font-medium">{salesOrder.currency} {Number(salesOrder.grand_total).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items for Billing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Quantities to Bill</h3>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Ordered</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Already Billed</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Available</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Qty to Bill</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Discount</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((item, index) => {
                      const soItem = salesOrder.items[index];
                      const orderedQty = Number(soItem.qty);
                      const billedQty = Number(soItem.billed_qty);
                      
                      // Calculate proportional amounts
                      const proportion = orderedQty > 0 ? item.qty_to_bill / orderedQty : 1;
                      const lineSubtotal = item.qty_to_bill * item.rate;
                      const lineDiscount = item.discount_amount * proportion;
                      const lineTax = item.tax_amount * proportion;
                      const lineTotal = lineSubtotal - lineDiscount + lineTax;

                      return (
                        <tr key={item.item_id}>
                          <td className="px-4 py-3 text-sm">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-right">{orderedQty}</td>
                          <td className="px-4 py-3 text-sm text-right">{billedQty}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{item.max_qty}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {item.qty_to_bill}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{item.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            {lineDiscount > 0 ? `-${lineDiscount.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600">
                            {lineTax > 0 ? `+${lineTax.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <BankAccountDetails />

          {/* Invoice Total */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{salesOrder.currency} {invoiceTotals.subtotal.toFixed(2)}</span>
              </div>
              {invoiceTotals.totalDiscount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium text-red-600">-{salesOrder.currency} {invoiceTotals.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              {invoiceTotals.totalTax > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium text-green-600">+{salesOrder.currency} {invoiceTotals.totalTax.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Invoice Total:</span>
                <span>{salesOrder.currency} {invoiceTotals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !hasValidItems}>
              {creating ? 'Creating Invoice...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
