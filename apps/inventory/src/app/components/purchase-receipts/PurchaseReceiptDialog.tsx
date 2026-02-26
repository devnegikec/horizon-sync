import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { usePurchaseReceiptActions } from '../../hooks/usePurchaseReceiptActions';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useUserStore } from '@horizon-sync/store';
import { purchaseOrderApi } from '../../utility/api';
import type { CreatePurchaseReceiptPayload } from '../../types/purchase-receipt.types';
import type { PurchaseOrder } from '../../types/purchase-order.types';

interface PurchaseReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface LineItemReceiving {
  purchase_order_line_id: string;
  item_id: string;
  item_name?: string;
  ordered_quantity: number;
  received_quantity: number;
  remaining_quantity: number;
  receiving_now: number;
}

export function PurchaseReceiptDialog({
  open,
  onOpenChange,
  onSave,
}: PurchaseReceiptDialogProps) {
  const { createPurchaseReceipt, loading } = usePurchaseReceiptActions();
  const accessToken = useUserStore((s) => s.accessToken);
  
  // Fetch submitted/partially_received POs
  const { purchaseOrders } = usePurchaseOrders({
    status: 'submitted',
    page_size: 100,
  });

  const [selectedPOId, setSelectedPOId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<LineItemReceiving[]>([]);
  const [loadingPO, setLoadingPO] = useState(false);

  // Fetch PO details when selected
  useEffect(() => {
    if (selectedPOId && accessToken) {
      setLoadingPO(true);
      purchaseOrderApi.getById(accessToken, selectedPOId)
        .then((po: PurchaseOrder) => {
          const items: LineItemReceiving[] = po.line_items.map((line) => ({
            purchase_order_line_id: line.id,
            item_id: line.item_id,
            ordered_quantity: line.quantity,
            received_quantity: line.received_quantity,
            remaining_quantity: line.quantity - line.received_quantity,
            receiving_now: 0,
          }));
          setLineItems(items);
        })
        .catch((err) => {
          console.error('Error fetching PO:', err);
          setLineItems([]);
        })
        .finally(() => {
          setLoadingPO(false);
        });
    } else {
      setLineItems([]);
    }
  }, [selectedPOId, accessToken]);

  const handleReceivingChange = (index: number, value: number) => {
    const updated = [...lineItems];
    const maxValue = updated[index].remaining_quantity;
    updated[index].receiving_now = Math.min(Math.max(0, value), maxValue);
    setLineItems(updated);
  };

  const handleSubmit = async () => {
    if (!selectedPOId) return;

    const itemsToReceive = lineItems.filter((item) => item.receiving_now > 0);
    if (itemsToReceive.length === 0) {
      return;
    }

    const payload: CreatePurchaseReceiptPayload = {
      reference_type: 'PURCHASE_ORDER',
      reference_id: selectedPOId,
      received_date: receivedDate,
      line_items: itemsToReceive.map((item) => ({
        purchase_order_line_id: item.purchase_order_line_id,
        item_id: item.item_id,
        quantity: item.receiving_now,
      })),
    };

    const result = await createPurchaseReceipt(payload);
    if (result) {
      onSave();
      // Reset form
      setSelectedPOId('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setLineItems([]);
    }
  };

  const totalReceiving = lineItems.reduce((sum, item) => sum + item.receiving_now, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Purchase Receipt</DialogTitle>
          <DialogDescription>
            Record goods received from supplier. This will update stock levels and Purchase Order status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Purchase Order Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po">Purchase Order *</Label>
              <Select value={selectedPOId} onValueChange={setSelectedPOId}>
                <SelectTrigger id="po">
                  <SelectValue placeholder="Select Purchase Order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders
                    .filter((po) => po.status === 'submitted' || po.status === 'partially_received')
                    .map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        PO-{po.id.slice(0, 8)} - {po.supplier_name || po.party_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Received Date *</Label>
              <Input
                id="date"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Warning Alert */}
          {selectedPOId && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Recording this receipt will update stock levels and Purchase Order status automatically.
                </p>
              </div>
            </div>
          )}

          {/* Line Items */}
          {loadingPO ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lineItems.length > 0 ? (
            <div className="space-y-2">
              <Label>Line Items</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Receiving Now</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.purchase_order_line_id}>
                        <TableCell className="font-mono text-sm">
                          {item.item_name || item.item_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                        <TableCell className="text-right">{item.received_quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {item.remaining_quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            max={item.remaining_quantity}
                            value={item.receiving_now}
                            onChange={(e) => handleReceivingChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                            disabled={item.remaining_quantity === 0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground">
                Total items receiving: {totalReceiving}
              </p>
            </div>
          ) : selectedPOId ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No line items found for this Purchase Order
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a Purchase Order to view line items
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedPOId || totalReceiving === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              'Record Receipt'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
