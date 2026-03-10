import * as React from 'react';

import { Receipt } from 'lucide-react';

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

import type { DeliveryNote } from '../../types/delivery-note.types';

interface ConvertToInvoiceItem {
  item_id: string; // delivery_note_item UUID
  item_name: string;
  qty_delivered: number;
  qty_to_bill: number;
  rate: number;
  uom: string;
}

interface ConvertDNToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onConvert: (
    deliveryNoteId: string,
    data: {
      items: { item_id: string; qty_to_bill: number }[];
      due_date?: string;
      remarks?: string;
    },
  ) => Promise<void>;
  converting: boolean;
}

export function ConvertDNToInvoiceDialog({
  open,
  onOpenChange,
  deliveryNote,
  onConvert,
  converting,
}: ConvertDNToInvoiceDialogProps) {
  const [lineItems, setLineItems] = React.useState<ConvertToInvoiceItem[]>([]);
  const [dueDate, setDueDate] = React.useState('');
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    if (open && deliveryNote) {
      const items = deliveryNote.line_items ?? [];
      setLineItems(
        items.map((item) => ({
          item_id: item.id,
          item_name: item.item_name || item.item_sku || item.item_id,
          qty_delivered: Number(item.quantity_shipped ?? item.quantity_ordered ?? 0),
          qty_to_bill: Number(item.quantity_shipped ?? item.quantity_ordered ?? 0),
          rate: 0,
          uom: item.warehouse_location || '',
        })),
      );
      setDueDate('');
      setRemarks('');
    }
  }, [open, deliveryNote]);

  const handleQtyChange = (index: number, value: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], qty_to_bill: value };
      return updated;
    });
  };

  const invoiceTotal = React.useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.qty_to_bill * item.rate, 0);
  }, [lineItems]);

  const hasValidItems = lineItems.some((item) => item.qty_to_bill > 0);
  const hasValidationError = lineItems.some(
    (item) => item.qty_to_bill > item.qty_delivered || item.qty_to_bill < 0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryNote) return;

    if (hasValidationError) {
      alert('Quantity to bill cannot exceed delivered quantity');
      return;
    }
    if (!hasValidItems) {
      alert('At least one line item must have a quantity to bill');
      return;
    }

    const items = lineItems
      .filter((item) => item.qty_to_bill > 0)
      .map((item) => ({
        item_id: item.item_id,
        qty_to_bill: item.qty_to_bill,
      }));

    await onConvert(deliveryNote.id, {
      items,
      due_date: dueDate || undefined,
      remarks: remarks || undefined,
    });
  };

  if (!deliveryNote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Receipt className="h-5 w-5" />
            Convert Delivery Note to Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DN Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Note</p>
                <p className="font-semibold">{deliveryNote.delivery_note_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{deliveryNote.customer_name || deliveryNote.customer_id}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{deliveryNote.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sales Order</p>
                <p className="font-medium">{deliveryNote.sales_order_number || '—'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Quantities to Bill</h3>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Qty to Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lineItems.map((item, index) => {
                      const isOverBilled = item.qty_to_bill > item.qty_delivered;
                      return (
                        <tr key={item.item_id} className={isOverBilled ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <td className="px-4 py-3 text-sm">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{item.qty_delivered}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.qty_delivered}
                              step="1"
                              value={item.qty_to_bill}
                              onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                              className={`w-24 text-right ml-auto ${isOverBilled ? 'border-red-500' : ''}`}
                              disabled={item.qty_delivered === 0}
                            />
                            {isOverBilled && (
                              <p className="text-xs text-red-500 mt-1">Exceeds delivered</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks (optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Invoice notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={converting}>
              Cancel
            </Button>
            <Button type="submit" disabled={converting || !hasValidItems || hasValidationError}>
              {converting ? 'Creating Invoice...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
