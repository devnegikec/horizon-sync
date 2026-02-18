import * as React from 'react';

import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Textarea } from '@horizon-sync/ui/components';

import type { CustomerResponse } from '../../types/customer.types';
import type { QuotationLineItemCreate } from '../../types/quotation.types';
import type { SalesOrder, SalesOrderCreate, SalesOrderItemCreate, SalesOrderStatus, SalesOrderUpdate } from '../../types/sales-order.types';
import { customerApi } from '../../utility/api/customers';
import { LineItemTable } from '../quotations/LineItemTable';

interface SalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onSave: (data: SalesOrderCreate | SalesOrderUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

const emptyItem: SalesOrderItemCreate = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  sort_order: 0,
};

export function SalesOrderDialog({ open, onOpenChange, salesOrder, onSave, saving }: SalesOrderDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!salesOrder;

  const [formData, setFormData] = React.useState({
    sales_order_no: '',
    customer_id: '',
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: '',
    currency: 'INR',
    status: 'draft' as SalesOrderStatus,
    remarks: '',
  });

  const [items, setItems] = React.useState<QuotationLineItemCreate[]>([{ ...emptyItem, sort_order: 1 }]);
  const [initialItemsData, setInitialItemsData] = React.useState<any[]>([]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  React.useEffect(() => {
    if (salesOrder) {
      setFormData({
        sales_order_no: salesOrder.sales_order_no,
        customer_id: salesOrder.customer_id,
        order_date: salesOrder.order_date.slice(0, 10),
        delivery_date: salesOrder.delivery_date ? salesOrder.delivery_date.slice(0, 10) : '',
        currency: salesOrder.currency,
        status: salesOrder.status || 'draft',
        remarks: salesOrder.remarks || '',
      });
      if (salesOrder.items && salesOrder.items.length > 0) {
        // Set all items as initial data for the cache (they contain full details in edit mode)
        setInitialItemsData(salesOrder.items);

        setItems(salesOrder.items.map((item) => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
        })));
      } else {
        setInitialItemsData([]);
      }
    } else {
      setFormData({
        sales_order_no: '',
        customer_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        delivery_date: '',
        currency: 'INR',
        status: 'draft',
        remarks: '',
      });
      setItems([{ ...emptyItem, sort_order: 1 }]);
      setInitialItemsData([]);
    }
  }, [salesOrder, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const grandTotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [items]);

  const isLineItemEditingDisabled = isEdit && formData.status !== 'draft';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }
    if (items.length === 0 || items.some(item => !item.item_id)) {
      alert('Please add at least one line item with a valid item');
      return;
    }
    if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) {
      alert('All line items must have positive quantities and non-negative rates');
      return;
    }
    if (formData.delivery_date && new Date(formData.delivery_date) < new Date(formData.order_date)) {
      alert('Delivery date must be after order date');
      return;
    }

    if (isEdit) {
      const updateData: SalesOrderUpdate = {
        order_date: new Date(formData.order_date).toISOString(),
        delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null,
        status: formData.status,
        remarks: formData.remarks || null,
      };

      if (!isLineItemEditingDisabled) {
        updateData.items = items.map(item => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
        }));
      }

      await onSave(updateData, salesOrder.id);
    } else {
      const createData: SalesOrderCreate = {
        sales_order_no: formData.sales_order_no || undefined,
        customer_id: formData.customer_id,
        order_date: new Date(formData.order_date).toISOString(),
        delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null,
        status: formData.status,
        grand_total: grandTotal,
        currency: formData.currency,
        remarks: formData.remarks || null,
        items: items.map(item => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
        })),
      };
      await onSave(createData);
    }
  };

  const canChangeStatus = isEdit && salesOrder;
  const availableStatuses: SalesOrderStatus[] = React.useMemo(() => {
    if (!canChangeStatus) return ['draft'];

    const current = formData.status;
    if (current === 'draft') return ['draft', 'confirmed'];
    if (current === 'confirmed') return ['confirmed', 'partially_delivered', 'delivered', 'cancelled'];
    if (current === 'partially_delivered') return ['partially_delivered', 'delivered', 'cancelled'];
    if (current === 'delivered') return ['delivered', 'closed', 'cancelled'];
    return [current]; // Terminal statuses can't change
  }, [canChangeStatus, formData.status]);

  const statusLabels: Record<SalesOrderStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    partially_delivered: 'Partially Delivered',
    delivered: 'Delivered',
    closed: 'Closed',
    cancelled: 'Cancelled',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sales Order' : 'Create Sales Order'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sales_order_no">Sales Order #</Label>
                <Input id="sales_order_no"
                  value={formData.sales_order_no}
                  onChange={(e) => handleChange('sales_order_no', e.target.value)}
                  disabled={isEdit}
                  placeholder={isEdit ? '' : 'Auto-generated if left blank'}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer *</Label>
                <Select value={formData.customer_id}
                  onValueChange={(v) => handleChange('customer_id', v)}
                  disabled={isEdit}
                  required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date *</Label>
                <Input id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => handleChange('order_date', e.target.value)}
                  required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select value={formData.currency}
                  onValueChange={(v) => handleChange('currency', v)}
                  disabled={isEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status}
                  onValueChange={(v) => handleChange('status', v as SalesOrderStatus)}
                  disabled={availableStatuses.length === 1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.filter(status => status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Additional notes..."
              rows={2}/>
          </div>

          {/* Line Items */}
          <Separator />
          <LineItemTable items={items}
            onItemsChange={setItems}
            disabled={isLineItemEditingDisabled}
            initialItemsData={initialItemsData} />

          {/* Fulfillment Info (edit mode only) */}
          {isEdit && salesOrder?.items && salesOrder.items.some(i => Number(i.billed_qty) > 0 || Number(i.delivered_qty) > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Fulfillment Status</h3>
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Ordered</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Billed</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {salesOrder.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-4 py-3 text-sm">{item.item_name || item.item_id}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.qty)}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.billed_qty)}</td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.delivered_qty)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Grand Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Grand Total:</span>
                <span>{formData.currency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Sales Order' : 'Create Sales Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
