import * as React from 'react';

import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { CustomerResponse } from '../../types/customer.types';
import type { Quotation, QuotationCreate, QuotationLineItemCreate, QuotationStatus, QuotationUpdate } from '../../types/quotation.types';
import { customerApi } from '../../utility/api';

import { QuotationFormFields } from './QuotationFormFields';
import { QuotationLineItemsTable } from './QuotationLineItemsTable';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onSave: (data: QuotationCreate | QuotationUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

interface FormState {
  quotation_no: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  currency: string;
  status: QuotationStatus;
  remarks: string;
  discount_type: 'flat' | 'percentage';
  discount_value: string;
}

const emptyItem: QuotationLineItemCreate = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  discount_type: 'percentage',
  discount_value: 0,
  discount_amount: 0,
  tax_rate: 0,
  tax_amount: 0,
  total_amount: 0,
  sort_order: 0,
};

const LOCKED_STATUSES: QuotationStatus[] = ['sent', 'accepted', 'rejected', 'expired'];

function validateQuotationForm(formData: FormState, items: QuotationLineItemCreate[]): string | null {
  if (!formData.customer_id) return 'Please select a customer';
  if (items.length === 0 || items.some(item => !item.item_id)) return 'Please add at least one line item with a valid item';
  if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) return 'All line items must have positive quantities and non-negative rates';
  if (new Date(formData.valid_until) < new Date(formData.quotation_date)) return 'Valid until date must be after quotation date';
  return null;
}

function computeDocumentDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((subtotal * discountValue / 100).toFixed(2));
  return Math.min(discountValue, subtotal);
}

function buildSavePayload(
  formData: FormState,
  items: QuotationLineItemCreate[],
  subtotal: number,
  totalDiscountAmount: number,
  grandTotal: number,
  quotation: Quotation | null,
  isLineItemEditingDisabled: boolean
): { data: QuotationCreate | QuotationUpdate; id?: string } {
  const discountType = (formData.discount_type || 'percentage') as 'flat' | 'percentage';
  const discountValue = Number(formData.discount_value) || 0;

  if (quotation) {
    const updateData: QuotationUpdate = {
      quotation_date: new Date(formData.quotation_date).toISOString(),
      valid_until: new Date(formData.valid_until).toISOString(),
      status: formData.status,
      remarks: formData.remarks || undefined,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: totalDiscountAmount,
    };
    if (!isLineItemEditingDisabled) {
      updateData.items = items;
    }
    return { data: updateData, id: quotation.id };
  }

  const createData: QuotationCreate = {
    quotation_no: formData.quotation_no || undefined,
    customer_id: formData.customer_id,
    quotation_date: new Date(formData.quotation_date).toISOString(),
    valid_until: new Date(formData.valid_until).toISOString(),
    status: formData.status,
    grand_total: grandTotal,
    currency: formData.currency,
    remarks: formData.remarks || undefined,
    discount_type: discountType,
    discount_value: discountValue,
    discount_amount: totalDiscountAmount,
    items,
  };
  return { data: createData };
}

function getAvailableStatuses(isEdit: boolean, currentStatus: QuotationStatus): QuotationStatus[] {
  if (!isEdit) return ['draft'];
  if (currentStatus === 'draft') return ['draft', 'sent'];
  if (currentStatus === 'sent') return ['sent', 'accepted', 'rejected', 'expired'];
  return [currentStatus];
}

export function QuotationDialog({ open, onOpenChange, quotation, onSave, saving }: QuotationDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!quotation;

  const [formData, setFormData] = React.useState<FormState>({
    quotation_no: '',
    customer_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until: new Date().toISOString().slice(0, 10),
    currency: 'INR',
    status: 'draft',
    remarks: '',
    discount_type: 'percentage',
    discount_value: '0',
  });

  const [items, setItems] = React.useState<QuotationLineItemCreate[]>([{ ...emptyItem, sort_order: 1 }]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  const initializeFormData = React.useCallback(() => {
    if (quotation) {
      setFormData({
        quotation_no: quotation.quotation_no,
        customer_id: quotation.customer_id,
        quotation_date: quotation.quotation_date.slice(0, 10),
        valid_until: quotation.valid_until.slice(0, 10),
        currency: quotation.currency,
        status: quotation.status,
        remarks: quotation.remarks || '',
        discount_type: (quotation.discount_type as 'flat' | 'percentage') || 'percentage',
        discount_value: String(quotation.discount_value ?? 0),
      });
      const lineItems = quotation.items || quotation.line_items || [];
      setItems(lineItems.length > 0 ? (lineItems as QuotationLineItemCreate[]) : [{ ...emptyItem, sort_order: 1 }]);
    } else {
      setFormData({
        quotation_no: '',
        customer_id: '',
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        currency: 'INR',
        status: 'draft',
        remarks: '',
        discount_type: 'percentage',
        discount_value: '0',
      });
      setItems([{ ...emptyItem, sort_order: 1 }]);
    }
  }, [quotation]);

  React.useEffect(() => {
    initializeFormData();
  }, [initializeFormData, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const subtotalAmount = React.useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    [items]
  );
  const subtotalTax = React.useMemo(
    () => items.reduce((sum, item) => sum + Number(item.tax_amount ?? 0), 0),
    [items]
  );
  const subtotalTotal = React.useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total_amount ?? item.amount ?? 0), 0),
    [items]
  );
  const subtotalLineDiscount = React.useMemo(
    () => items.reduce((sum, item) => sum + Number(item.discount_amount ?? 0), 0),
    [items]
  );

  const totalDiscountAmount = React.useMemo(() => {
    return computeDocumentDiscount(subtotalTotal, formData.discount_type, Number(formData.discount_value) || 0);
  }, [subtotalTotal, formData.discount_type, formData.discount_value]);

  const grandTotal = React.useMemo(() => {
    return Math.max(0, Number((subtotalTotal - totalDiscountAmount).toFixed(2)));
  }, [subtotalTotal, totalDiscountAmount]);

  const isLineItemEditingDisabled = isEdit && LOCKED_STATUSES.includes(formData.status);
  const availableStatuses = React.useMemo(() => getAvailableStatuses(isEdit, formData.status), [isEdit, formData.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateQuotationForm(formData, items);
    if (validationError) {
      alert(validationError);
      return;
    }
    const { data, id } = buildSavePayload(formData, items, subtotalTotal, totalDiscountAmount, grandTotal, quotation, isLineItemEditingDisabled);
    await onSave(data, id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Quotation' : 'Create Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <QuotationFormFields formData={formData} customers={customers} isEdit={isEdit} availableStatuses={availableStatuses} onFieldChange={handleChange} />

          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Line Items</h3>
            <QuotationLineItemsTable items={items}
              onItemsChange={setItems}
              disabled={isLineItemEditingDisabled}
              currency={formData.currency}
              summary={{
                subtotalAmount,
                subtotalTax,
                subtotalTotal,
                subtotalLineDiscount,
                discountAmount: totalDiscountAmount,
                grandTotal,
                documentDiscount: {
                  type: formData.discount_type,
                  value: formData.discount_value,
                  onTypeChange: (v) => handleChange('discount_type', v),
                  onValueChange: (v) => handleChange('discount_value', v),
                  disabled: isLineItemEditingDisabled,
                },
              }}/>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
