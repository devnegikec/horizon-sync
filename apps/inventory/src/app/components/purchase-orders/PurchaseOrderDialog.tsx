import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
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
import { usePurchaseOrderActions } from '../../hooks/usePurchaseOrderActions';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useItems } from '../../hooks/useItems';
import { useRFQs } from '../../hooks/useRFQs';
import type { PurchaseOrder, CreatePurchaseOrderPayload } from '../../types/purchase-order.types';

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onSave: () => void;
}

interface LineItemForm {
  item_id: string;
  quantity: number;
  unit_price: number;
}

export function PurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSave,
}: PurchaseOrderDialogProps) {
  const { createPurchaseOrder, updatePurchaseOrder, loading } = usePurchaseOrderActions();
  const { suppliers = [] } = useSuppliers();
  const { items = [] } = useItems();
  
  // Load RFQs only when dialog is open to avoid unnecessary API calls
  const { rfqs = [], loading: rfqsLoading, error: rfqsError } = useRFQs(
    open ? { page_size: 100 } : { page_size: 0 }
  );

  const [supplierId, setSupplierId] = useState('');
  const [rfqId, setRfqId] = useState('__none__'); // Use special value instead of empty string
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { item_id: '', quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    if (purchaseOrder) {
      setSupplierId(purchaseOrder.party_id);
      setRfqId(purchaseOrder.rfq_id || '__none__');
      setTaxRate(purchaseOrder.tax_rate || 0);
      setDiscountAmount(purchaseOrder.discount_amount || 0);
      setLineItems(
        purchaseOrder.line_items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      );
    } else {
      setSupplierId('');
      setRfqId('__none__');
      setTaxRate(0);
      setDiscountAmount(0);
      setLineItems([{ item_id: '', quantity: 1, unit_price: 0 }]);
    }
  }, [purchaseOrder, open]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { item_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleSubmit = async () => {
    // Validation
    if (!supplierId) {
      return;
    }
    const hasEmptyItems = lineItems.some((item) => !item.item_id || item.quantity <= 0 || item.unit_price < 0);
    if (hasEmptyItems) {
      return;
    }

    const payload: CreatePurchaseOrderPayload = {
      supplier_id: supplierId,
      rfq_id: rfqId !== '__none__' ? rfqId : undefined,
      tax_rate: taxRate,
      discount_amount: discountAmount,
      line_items: lineItems.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    let result;
    if (purchaseOrder) {
      result = await updatePurchaseOrder(purchaseOrder.id, payload);
    } else {
      result = await createPurchaseOrder(payload);
    }

    if (result) {
      onSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchaseOrder ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
          <DialogDescription>
            {purchaseOrder
              ? 'Update the purchase order details and line items.'
              : 'Create a new purchase order to order materials from a supplier.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Supplier and RFQ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfq">RFQ Reference (Optional)</Label>
              <Select value={rfqId} onValueChange={setRfqId}>
                <SelectTrigger id="rfq">
                  <SelectValue placeholder={rfqsLoading ? "Loading RFQs..." : "Select RFQ"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {!rfqsError && rfqs.map((rfq) => (
                    <SelectItem key={rfq.id} value={rfq.id}>
                      RFQ-{rfq.id.slice(0, 8)} - {rfq.status}
                    </SelectItem>
                  ))}
                  {rfqsError && (
                    <SelectItem value="__none__" disabled>
                      Error loading RFQs
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                  <div className="col-span-5">
                    <Label htmlFor={`item-${index}`}>Item</Label>
                    <Select
                      value={item.item_id}
                      onValueChange={(value) => handleLineItemChange(index, 'item_id', value)}
                    >
                      <SelectTrigger id={`item-${index}`}>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((itm) => (
                          <SelectItem key={itm.id} value={itm.id}>
                            {itm.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`price-${index}`}>Unit Price</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Line Total</Label>
                    <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                      <span className="text-sm font-medium">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax">Tax Rate (%)</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount Amount</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium">-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Grand Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
