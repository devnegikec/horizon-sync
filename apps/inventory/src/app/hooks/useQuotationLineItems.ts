import * as React from 'react';


import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { QuotationLineItem, QuotationLineItemCreate, PickerResponse } from '../types/quotation.types';

export function useQuotationLineItems(
  items: QuotationLineItemCreate[],
  onItemsChange: (items: QuotationLineItemCreate[]) => void
) {
  const accessToken = useUserStore((s) => s.accessToken);
  const itemsCacheRef = React.useRef<Map<string, QuotationLineItem>>(new Map());

  // Seed cache synchronously from items that already carry item_name (edit mode — API returns enriched data)
  React.useMemo(() => {
    items.forEach((item) => {
      if (item.item_id && !itemsCacheRef.current.has(item.item_id)) {
        const full = item as unknown as QuotationLineItem;
        if (full.item_name) {
          itemsCacheRef.current.set(item.item_id, full);
        }
      }
    });
  }, [items]);

  const searchItems = React.useCallback(async (query: string): Promise<QuotationLineItem[]> => {
    if (!accessToken) return [];
    const response = await fetch(`${environment.apiCoreUrl}/items/picker?search=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data: PickerResponse = await response.json();
    data.items.forEach(item => { itemsCacheRef.current.set(item.id, item); });
    return data.items;
  }, [accessToken]);

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    []
  );

  const computeDiscountAmount = (amount: number, discountType: string, discountValue: number): number => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') return Number((amount * discountValue / 100).toFixed(2));
    return Math.min(discountValue, amount);
  };

  const handleDataChange = React.useCallback(
    (newData: QuotationLineItemCreate[]) => {
      const updatedData = newData.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const cachedItem = itemsCacheRef.current.get(item.item_id);
        let taxRate = 0;
        let taxTemplateId: string | null = null;
        if (cachedItem?.tax_info) {
          taxTemplateId = cachedItem.tax_info.id;
          taxRate = cachedItem.tax_info.breakup.reduce((sum, tax) => sum + tax.rate, 0);
        }
        const amount = qty * rate;
        const discountType = (item.discount_type || 'percentage') as 'flat' | 'percentage';
        const discountVal = Number(item.discount_value ?? 0);
        const discountAmount = computeDiscountAmount(amount, discountType, discountVal);
        const netAmount = amount - discountAmount;
        const taxAmount = (netAmount * taxRate) / 100;
        const totalAmount = netAmount + taxAmount;
        return {
          ...item,
          qty,
          rate,
          amount,
          discount_type: discountType,
          discount_value: discountVal,
          discount_amount: Number(discountAmount.toFixed(2)),
          tax_template_id: taxTemplateId,
          tax_rate: taxRate,
          tax_amount: Number(taxAmount.toFixed(2)),
          total_amount: Number(totalAmount.toFixed(2)),
        };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  return {
    searchItems,
    getItemData,
    handleDataChange,
  };
}
