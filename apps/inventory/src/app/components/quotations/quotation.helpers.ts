import type { Quotation, QuotationCreate, QuotationLineItemCreate, QuotationStatus, QuotationUpdate, QuotationFormState } from '../../types/quotation.types';

export const emptyItem: QuotationLineItemCreate = {
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

export const LOCKED_STATUSES: QuotationStatus[] = ['sent', 'accepted', 'rejected', 'expired'];

export function validateQuotationForm(formData: QuotationFormState, items: QuotationLineItemCreate[]): string | null {
  if (!formData.customer_id) return 'Please select a customer';
  if (items.length === 0 || items.some(item => !item.item_id)) return 'Please add at least one line item with a valid item';
  if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) return 'All line items must have positive quantities and non-negative rates';
  if (new Date(formData.valid_until) < new Date(formData.quotation_date)) return 'Valid until date must be after quotation date';
  return null;
}

export function computeDocumentDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((subtotal * discountValue / 100).toFixed(2));
  return Math.min(discountValue, subtotal);
}

export function buildSavePayload(
  formData: QuotationFormState,
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

export function getAvailableStatuses(isEdit: boolean, currentStatus: QuotationStatus): QuotationStatus[] {
  if (!isEdit) return ['draft'];
  if (currentStatus === 'draft') return ['draft', 'sent'];
  if (currentStatus === 'sent') return ['sent', 'accepted', 'rejected', 'expired'];
  return [currentStatus];
}
