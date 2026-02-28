import * as React from 'react';

import { useQuery } from '@tanstack/react-query';

 
import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { CustomerResponse } from '../../types/customer.types';
import type { QuotationLineItemCreate } from '../../types/quotation.types';
import type { SalesOrder, SalesOrderCreate, SalesOrderItemCreate, SalesOrderStatus, SalesOrderUpdate } from '../../types/sales-order.types';
import { customerApi } from '../../utility/api/customers';
import { QuotationLineItemsTable } from '../quotations/QuotationLineItemsTable';

import { FulfillmentStatusTable } from './FulfillmentStatusTable';
import { SalesOrderFormFields } from './SalesOrderFormFields';

// ---------- types ----------

type SalesOrderFormItem = QuotationLineItemCreate &
  Partial<Pick<SalesOrderItemCreate, 'discount_type' | 'discount_value' | 'discount_amount'>>;

interface SalesOrderFormData {
  sales_order_no: string;
  customer_id: string;
  order_date: string;
  delivery_date: string;
  currency: string;
  status: SalesOrderStatus;
  remarks: string;
  discount_type: 'flat' | 'percentage';
  discount_value: string;
}

interface SalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onSave: (data: SalesOrderCreate | SalesOrderUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

// ---------- helpers ----------

function computeDocumentDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((subtotal * discountValue / 100).toFixed(2));
  return Math.min(discountValue, subtotal);
}

function validateForm(formData: SalesOrderFormData, items: QuotationLineItemCreate[]): string | null {
  if (!formData.customer_id) return 'Please select a customer';
  if (items.length === 0 || items.some(item => !item.item_id)) return 'Please add at least one line item with a valid item';
  if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) return 'All line items must have positive quantities and non-negative rates';
  if (formData.delivery_date && new Date(formData.delivery_date) < new Date(formData.order_date)) return 'Delivery date must be after order date';
  return null;
}

function mapItemsToCreate(items: QuotationLineItemCreate[]): SalesOrderItemCreate[] {
  return items.map((item): SalesOrderItemCreate => ({
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

function getAvailableStatuses(isEdit: boolean, currentStatus: SalesOrderStatus): SalesOrderStatus[] {
  if (!isEdit) return ['draft'];
  if (currentStatus === 'draft') return ['draft', 'confirmed'];
  if (currentStatus === 'confirmed') return ['confirmed', 'partially_delivered', 'delivered', 'cancelled'];
  if (currentStatus === 'partially_delivered') return ['partially_delivered', 'delivered', 'cancelled'];
  if (currentStatus === 'delivered') return ['delivered', 'closed', 'cancelled'];
  return [currentStatus];
}

function mapSalesOrderLineItems(soItems: SalesOrder['items']): SalesOrderFormItem[] {
  return soItems.map((item): SalesOrderFormItem => ({
    item_id: item.item_id,
    qty: Number(item.qty),
    uom: item.uom,
    rate: Number(item.rate),
    amount: Number(item.amount),
    sort_order: item.sort_order,
    discount_type: item.discount_type ?? 'percentage',
    discount_value: Number(item.discount_value ?? 0),
    discount_amount: Number(item.discount_amount ?? 0),
    tax_template_id: (item as unknown as { tax_template_id?: string | null }).tax_template_id ?? null,
    tax_rate: item.tax_info?.breakup?.reduce((s, t) => s + t.rate, 0),
    tax_amount: item.tax_amount,
    total_amount: item.total_amount,
  }));
}

function buildUpdatePayload(
  formData: SalesOrderFormData,
  items: QuotationLineItemCreate[],
  totalDiscountAmount: number,
  isLineItemEditingDisabled: boolean,
): SalesOrderUpdate {
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
    updateData.items = mapItemsToCreate(items);
  }
  return updateData;
}

function buildCreatePayload(
  formData: SalesOrderFormData,
  items: QuotationLineItemCreate[],
  totalDiscountAmount: number,
  grandTotal: number,
): SalesOrderCreate {
  return {
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
    items: mapItemsToCreate(items),
  };
}

const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const emptyItem: QuotationLineItemCreate = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  sort_order: 0,
};

const DEFAULT_FORM: SalesOrderFormData = {
  sales_order_no: '',
  customer_id: '',
  order_date: new Date().toISOString().slice(0, 10),
  delivery_date: '',
  currency: 'INR',
  status: 'draft',
  remarks: '',
  discount_type: 'percentage',
  discount_value: '',
};

function deriveFormData(salesOrder: SalesOrder | null): { form: SalesOrderFormData; items: QuotationLineItemCreate[] } {
  if (!salesOrder) {
    return {
      form: { ...DEFAULT_FORM, order_date: new Date().toISOString().slice(0, 10) },
      items: [{ ...emptyItem, sort_order: 1 }],
    };
  }
  return {
    form: {
      sales_order_no: salesOrder.sales_order_no,
      customer_id: salesOrder.customer_id,
      order_date: salesOrder.order_date.slice(0, 10),
      delivery_date: salesOrder.delivery_date ? salesOrder.delivery_date.slice(0, 10) : '',
      currency: salesOrder.currency,
      status: salesOrder.status || 'draft',
      remarks: salesOrder.remarks || '',
      discount_type: (salesOrder.discount_type as 'flat' | 'percentage') || 'percentage',
      discount_value: String(salesOrder.discount_value ?? 0),
    },
    items: salesOrder.items?.length ? mapSalesOrderLineItems(salesOrder.items) : [{ ...emptyItem, sort_order: 1 }],
  };
}

function getSubmitLabel(saving: boolean, isEdit: boolean): string {
  if (saving) return 'Saving...';
  return isEdit ? 'Update Sales Order' : 'Create Sales Order';
}

function getDialogTitle(isEdit: boolean): string {
  return isEdit ? 'Edit Sales Order' : 'Create Sales Order';
}

// ---------- component ----------

export function SalesOrderDialog({ open, onOpenChange, salesOrder, onSave, saving }: SalesOrderDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!salesOrder;

  const [formData, setFormData] = React.useState<SalesOrderFormData>({ ...DEFAULT_FORM });
  const [items, setItems] = React.useState<QuotationLineItemCreate[]>([{ ...emptyItem, sort_order: 1 }]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  const initializeFormData = React.useCallback(() => {
    const derived = deriveFormData(salesOrder);
    setFormData(derived.form);
    setItems(derived.items);
  }, [salesOrder]);

  React.useEffect(() => { initializeFormData(); }, [initializeFormData, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // computed totals
  const subtotalAmount = React.useMemo(() => items.reduce((s, i) => s + Number(i.amount ?? 0), 0), [items]);
  const subtotalTax = React.useMemo(() => items.reduce((s, i) => s + Number(i.tax_amount ?? 0), 0), [items]);
  const subtotalTotal = React.useMemo(() => items.reduce((s, i) => s + Number(i.total_amount ?? i.amount ?? 0), 0), [items]);
  const subtotalLineDiscount = React.useMemo(() => items.reduce((s, i) => s + Number(i.discount_amount ?? 0), 0), [items]);
  const totalDiscountAmount = React.useMemo(() => computeDocumentDiscount(subtotalTotal, formData.discount_type, Number(formData.discount_value) || 0), [subtotalTotal, formData.discount_type, formData.discount_value]);
  const grandTotal = React.useMemo(() => Math.max(0, Number((subtotalTotal - totalDiscountAmount).toFixed(2))), [subtotalTotal, totalDiscountAmount]);

  const isLineItemEditingDisabled = isEdit && formData.status !== 'draft';
  const availableStatuses = React.useMemo(() => getAvailableStatuses(isEdit, formData.status), [isEdit, formData.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm(formData, items);
    if (err) { alert(err); return; }

    if (isEdit && salesOrder) {
      await onSave(buildUpdatePayload(formData, items, totalDiscountAmount, isLineItemEditingDisabled), salesOrder.id);
    } else {
      await onSave(buildCreatePayload(formData, items, totalDiscountAmount, grandTotal));
    }
  };

  const summary = React.useMemo(() => ({
    subtotalAmount,
    subtotalTax,
    subtotalTotal,
    subtotalLineDiscount,
    discountAmount: totalDiscountAmount,
    grandTotal,
    documentDiscount: {
      type: formData.discount_type,
      value: formData.discount_value,
      onTypeChange: (v: string) => handleChange('discount_type', v),
      onValueChange: (v: string) => handleChange('discount_value', v),
      disabled: isLineItemEditingDisabled,
    },
  }), [subtotalAmount, subtotalTax, subtotalTotal, subtotalLineDiscount, totalDiscountAmount, grandTotal, formData.discount_type, formData.discount_value, isLineItemEditingDisabled]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle(isEdit)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SalesOrderFormFields formData={formData} customers={customers} isEdit={isEdit} availableStatuses={availableStatuses} statusLabels={STATUS_LABELS} onFieldChange={handleChange} />

          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Line Items</h3>
            <QuotationLineItemsTable items={items} onItemsChange={setItems} disabled={isLineItemEditingDisabled} currency={formData.currency} summary={summary} />
          </div>

          {isEdit && salesOrder?.items && <FulfillmentStatusTable items={salesOrder.items} />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {getSubmitLabel(saving, isEdit)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
