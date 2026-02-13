import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { SearchableSelect } from '@horizon-sync/search';

import type { InvoiceLineItemFormData } from '../../types/invoice';
import { itemApi } from '../../utility/api';

interface InvoiceLineItemTableProps {
  items: InvoiceLineItemFormData[];
  onItemsChange: (items: InvoiceLineItemFormData[]) => void;
  readonly?: boolean;
  disabled?: boolean;
}

const emptyItem: InvoiceLineItemFormData = {
  item_id: '',
  description: '',
  quantity: 1,
  uom: 'pcs',
  rate: 0,
  tax_template_id: null,
};

export function InvoiceLineItemTable({ items, onItemsChange, readonly = false, disabled = false }: InvoiceLineItemTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data: itemsData, isLoading } = useQuery<{ items: { id: string; item_name: string; item_sku?: string; uom?: string }[] }>({
    queryKey: ['items-list'],
    queryFn: () => itemApi.list(accessToken || '', 1, 100) as Promise<{ items: { id: string; item_name: string; item_sku?: string; uom?: string }[] }>,
    enabled: !!accessToken && !readonly,
  });

  const availableItems = itemsData?.items ?? [];

  // List fetcher for SearchableSelect
  const itemListFetcher = React.useCallback(async () => {
    if (availableItems.length > 0) {
      return availableItems;
    }
    const data = await itemApi.list(accessToken || '', 1, 100) as { items: { id: string; item_name: string; item_sku?: string; uom?: string }[] };
    return data.items;
  }, [availableItems, accessToken]);

  // Label formatter for SearchableSelect
  const itemLabelFormatter = React.useCallback(
    (item: { id: string; item_name: string; item_sku?: string }) =>
      `${item.item_name}${item.item_sku ? ` (${item.item_sku})` : ''}`,
    []
  );

  const handleItemChange = (index: number, field: keyof InvoiceLineItemFormData, value: string | number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill UOM when item is selected
    if (field === 'item_id' && typeof value === 'string') {
      const selectedItem = availableItems.find((item) => item.id === value);
      if (selectedItem?.uom) {
        updated[index].uom = selectedItem.uom;
      }
      // Auto-fill description with item name
      if (selectedItem?.item_name) {
        updated[index].description = selectedItem.item_name;
      }
    }

    onItemsChange(updated);
  };

  const addItem = () => {
    onItemsChange([...items, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onItemsChange(updated);
  };

  // Calculate amount for display
  const calculateAmount = (item: InvoiceLineItemFormData) => {
    return item.quantity * item.rate;
  };

  // Calculate tax amount for display (placeholder - will be implemented with tax templates)
  const calculateTaxAmount = (item: InvoiceLineItemFormData) => {
    // TODO: Implement tax calculation when tax templates are available
    return 0;
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{item.item_id}</td>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm">{item.uom}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.rate).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">{calculateTaxAmount(item).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{calculateAmount(item).toFixed(2)}</td>
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
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
                <Label className="text-xs">Description</Label>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs">Quantity *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
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
              <div className="space-y-1">
                <Label className="text-xs">Tax Template</Label>
                <Select
                  value={item.tax_template_id || 'none'}
                  onValueChange={(v) => handleItemChange(index, 'tax_template_id', v === 'none' ? null : v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {/* TODO: Add tax templates when available */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <Input value={calculateAmount(item).toFixed(2)} disabled className="font-medium" />
              </div>
            </div>
            {item.tax_template_id && (
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1 md:col-start-5">
                  <Label className="text-xs">Tax Amount</Label>
                  <Input value={calculateTaxAmount(item).toFixed(2)} disabled className="text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
