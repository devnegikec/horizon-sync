import type { Quotation, QuotationCreate, QuotationLineItemCreate, QuotationStatus, QuotationUpdate, QuotationFormState, TableMeta, QuotationLineItem } from '../../types/quotation.types';

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

export function handleItemSelection(meta: TableMeta, rowIndex: number, newItemId: string) {
  meta.updateData?.(rowIndex, 'item_id', newItemId);
  const selectedItem = meta.getItemData?.(newItemId);
  if (selectedItem) {
    setTimeout(() => {
      meta.updateData?.(rowIndex, 'uom', selectedItem.uom);
      meta.updateData?.(rowIndex, 'rate', parseFloat(selectedItem.standard_rate || '0') || 0);
      meta.updateData?.(rowIndex, 'qty', selectedItem.min_order_qty || 1);
    }, 0);
  }
}

export const defaultLabelFormatter = (item: QuotationLineItem) => item.item_name ?? '';
export const defaultSearchItems = async () => [] as QuotationLineItem[];

export function getQtyError(qty: number, itemData: QuotationLineItem): { message: string; color: string } | null {
  const min = itemData.min_order_qty;
  const max = itemData.max_order_qty;
  const available = itemData.stock_levels?.quantity_available;
  if (min != null && min > 0 && qty < min) return { message: `Below min (${min})`, color: 'hsl(0 84% 60%)' };
  if (max != null && max > 0 && qty > max) return { message: `Exceeds max (${max})`, color: 'hsl(0 84% 60%)' };
  if (available != null && qty > available) return { message: `Exceeds available (${available})`, color: 'hsl(25 95% 53%)' };
  return null;
}

export function computeLineDiscountAmount(lineAmount: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((lineAmount * discountValue / 100).toFixed(2));
  return Math.min(discountValue, lineAmount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function buildTaxSummaryMap(quotation: Quotation) {
  const lineItems = quotation.items || quotation.line_items || [];
  const map = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();
  lineItems.forEach((item) => {
    if (!item.tax_info) return;
    const key = item.tax_info.template_code;
    if (!map.has(key)) {
      map.set(key, {
        name: item.tax_info.template_name,
        amount: 0,
        breakup: item.tax_info.breakup.map((t) => ({ rule_name: t.rule_name, rate: t.rate, amount: 0 })),
      });
    }
    const entry = map.get(key);
    if (entry) {
      entry.amount += Number(item.tax_amount || 0);
      item.tax_info.breakup.forEach((t, idx) => {
        entry.breakup[idx].amount += (Number(item.amount) * t.rate) / 100;
      });
    }
  });
  return map;
}
