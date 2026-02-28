import * as React from 'react';

import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import type { CustomerResponse } from '../../types/customer.types';
import type { QuotationLineItemCreate } from '../../types/quotation.types';
import type { SalesOrder, SalesOrderCreate, SalesOrderItemCreate, SalesOrderStatus, SalesOrderUpdate } from '../../types/sales-order.types';
import { customerApi } from '../../utility/api/customers';
import { EditableLineItemsTable, type ItemData } from '../common';

import { SalesOrderFormFields } from './SalesOrderFormFields';

type SalesOrderFormItem = QuotationLineItemCreate & Partial<Pick<SalesOrderItemCreate, 'discount_type' | 'discount_value' | 'discount_amount'>>;

function computeDocumentDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((subtotal * discountValue / 100).toFixed(2));
  return Math.min(discountValue, subtotal);
}

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
    discount_type: 'percentage' as 'flat' | 'percentage',
    discount_value: '',
  });

  const [items, setItems] = React.useState<QuotationLineItemCreate[]>([{ ...emptyItem, sort_order: 1 }]);
  const [initialItemsData, setInitialItemsData] = React.useState<ItemData[]>([]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  // Search function for EditableLineItemsTable
  const searchItems = React.useCallback(async (query: string): Promise<ItemData[]> => {
    if (!accessToken) return [];

    const response = await fetch(`${environment.apiCoreUrl}/items/picker?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();
    return data.items || [];
  }, [accessToken]);

  // Initialize form data from sales order
  const initializeFormData = React.useCallback(() => {
    if (salesOrder) {
      setFormData({
        sales_order_no: salesOrder.sales_order_no,
        customer_id: salesOrder.customer_id,
        order_date: salesOrder.order_date.slice(0, 10),
        delivery_date: salesOrder.delivery_date ? salesOrder.delivery_date.slice(0, 10) : '',
        currency: salesOrder.currency,
        status: salesOrder.status || 'draft',
        remarks: salesOrder.remarks || '',
        discount_type: (salesOrder.discount_type as 'flat' | 'percentage') || 'percentage',
        discount_value: String(salesOrder.discount_value ?? 0),
      });
      
      if (salesOrder.items && salesOrder.items.length > 0) {
        const itemsData: ItemData[] = salesOrder.items.map(item => ({
          id: item.item_id,
          item_name: item.item_name || '',
          item_code: item.item_sku || '',
          uom: item.uom,
          standard_rate: typeof item.rate === 'string' ? item.rate : String(item.rate),
          tax_info: item.tax_info,
        }));
        setInitialItemsData(itemsData);

        setItems(salesOrder.items.map((item): SalesOrderFormItem => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
          discount_type: item.discount_type ?? 'percentage',
          discount_value: Number(item.discount_value ?? 0),
          discount_amount: Number(item.discount_amount ?? 0),
          tax_template_id: (item as { tax_template_id?: string | null }).tax_template_id ?? null,
          tax_rate: (item as { tax_rate?: number }).tax_rate,
          tax_amount: (item as { tax_amount?: number }).tax_amount,
          total_amount: (item as { total_amount?: number }).total_amount,
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
        discount_type: 'percentage',
        discount_value: '',
      });
      setItems([{ ...emptyItem, sort_order: 1 }]);
      setInitialItemsData([]);
    }
  }, [salesOrder]);

  React.useEffect(() => {
    initializeFormData();
  }, [initializeFormData, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const subtotalTotal = React.useMemo(
    () => items.reduce((sum, item) => sum + Number((item as { total_amount?: number }).total_amount ?? item.amount ?? 0), 0),
    [items]
  );
  const totalDiscountAmount = React.useMemo(
    () => computeDocumentDiscount(subtotalTotal, formData.discount_type, Number(formData.discount_value) || 0),
    [subtotalTotal, formData.discount_type, formData.discount_value]
  );
  const grandTotal = React.useMemo(
    () => Math.max(0, Number((subtotalTotal - totalDiscountAmount).toFixed(2))),
    [subtotalTotal, totalDiscountAmount]
  );

  const isLineItemEditingDisabled = isEdit && formData.status !== 'draft';

  // Validation helper
  const validateForm = (): string | null => {
    if (!formData.customer_id) return 'Please select a customer';
    if (items.length === 0 || items.some(item => !item.item_id)) return 'Please add at least one line item with a valid item';
    if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) return 'All line items must have positive quantities and non-negative rates';
    if (formData.delivery_date && new Date(formData.delivery_date) < new Date(formData.order_date)) return 'Delivery date must be after order date';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (isEdit) {
      const updateData: SalesOrderUpdate = {
        order_date: new Date(formData.order_date).toISOString(),
        delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null,
        status: formData.status,
        remarks: formData.remarks || null,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value) || 0,
        discount_amount: totalDiscountAmount,
      };

      if (!isLineItemEditingDisabled) {
        updateData.items = items.map((item): SalesOrderItemCreate => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
          discount_type: item.discount_type ?? 'percentage',
          discount_value: Number(item.discount_value ?? 0),
          discount_amount: Number(item.discount_amount ?? 0),
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
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value) || 0,
        discount_amount: totalDiscountAmount,
        items: items.map((item): SalesOrderItemCreate => ({
          item_id: item.item_id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          sort_order: item.sort_order,
          discount_type: item.discount_type ?? 'percentage',
          discount_value: Number(item.discount_value ?? 0),
          discount_amount: Number(item.discount_amount ?? 0),
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
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sales Order' : 'Create Sales Order'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SalesOrderFormFields formData={formData}
            customers={customers}
            isEdit={isEdit}
            availableStatuses={availableStatuses}
            statusLabels={statusLabels}
            onFieldChange={handleChange}/>

          {/* Line Items */}
          <Separator />
          <EditableLineItemsTable items={items}
            onItemsChange={setItems}
            disabled={isLineItemEditingDisabled}
            initialItemsData={initialItemsData}
            searchItems={searchItems}
            emptyItem={emptyItem}
            showTax={true}
            showItemGroup={true}/>

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

          {/* Totals with document discount */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal:</span>
                <span>{formData.currency} {subtotalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm">Discount:</span>
                <div className="flex items-center gap-2">
                  <Select value={formData.discount_type}
                    onValueChange={(v) => handleChange('discount_type', v)}
                    disabled={isLineItemEditingDisabled}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number"
                    min={0}
                    step={formData.discount_type === 'percentage' ? 1 : 0.01}
                    className="w-24 text-right"
                    value={formData.discount_value}
                    onChange={(e) => handleChange('discount_value', e.target.value)}
                    disabled={isLineItemEditingDisabled}
                    placeholder={formData.discount_type === 'percentage' ? '%' : 'Amount'}/>
                </div>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  −{formData.currency} {totalDiscountAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
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
