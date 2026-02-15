import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label } from '@horizon-sync/ui/components';
import { SearchableSelect } from '@horizon-sync/search';

import type { QuotationLineItemCreate } from '../../types/quotation.types';
import { itemApi } from '../../utility/api';

interface LineItemTableProps {
  items: QuotationLineItemCreate[];
  onItemsChange: (items: QuotationLineItemCreate[]) => void;
  readonly?: boolean;
  showFulfillmentStatus?: boolean;
  disabled?: boolean;
}

const emptyItem: QuotationLineItemCreate = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  sort_order: 0,
};

export function LineItemTable({ items, onItemsChange, readonly = false, disabled = false }: LineItemTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data: itemsData, isLoading } = useQuery<{ items: { id: string; item_name: string; item_sku?: string }[] }>({
    queryKey: ['items-list'],
    queryFn: () => itemApi.list(accessToken || '', 1, 100) as Promise<{ items: { id: string; item_name: string; item_sku?: string }[] }>,
    enabled: !!accessToken && !readonly,
  });

  const availableItems = itemsData?.items ?? [];

  // List fetcher for SearchableSelect
  const itemListFetcher = React.useCallback(async () => {
    if (availableItems.length > 0) {
      return availableItems;
    }
    const data = await itemApi.list(accessToken || '', 1, 100) as { items: { id: string; item_name: string; item_sku?: string }[] };
    return data.items;
  }, [availableItems, accessToken]);

  // Label formatter for SearchableSelect
  const itemLabelFormatter = React.useCallback(
    (item: { id: string; item_name: string; item_sku?: string }) =>
      `${item.item_name}${item.item_sku ? ` (${item.item_sku})` : ''}`,
    []
  );

  const handleItemChange = (index: number, field: keyof QuotationLineItemCreate, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'qty' || field === 'rate') {
      updated[index].amount = Number(updated[index].qty) * Number(updated[index].rate);
    }

    onItemsChange(updated);
  };

  const addItem = () => {
    onItemsChange([...items, { ...emptyItem, sort_order: items.length + 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i + 1 }));
    onItemsChange(updated);
  };

  if (readonly) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{item.item_id}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.qty}</td>
                    <td className="px-4 py-3 text-sm">{item.uom}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.rate).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Line Items</h3>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem} disabled={disabled}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={disabled}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Item *</Label>
                <SearchableSelect
                  entityType="items"
                  value={item.item_id}
                  onValueChange={(v) => handleItemChange(index, 'item_id', v)}
                  listFetcher={itemListFetcher}
                  labelFormatter={itemLabelFormatter}
                  valueKey="id"
                  placeholder="Select an item..."
                  disabled={disabled}
                  isLoading={isLoading}
                  items={availableItems}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.qty}
                  onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                  disabled={disabled}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UOM *</Label>
                <Input
                  value={item.uom}
                  onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                  placeholder="pcs"
                  disabled={disabled}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rate *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                  disabled={disabled}
                  required
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input value={Number(item.amount).toFixed(2)} disabled className="font-medium" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
