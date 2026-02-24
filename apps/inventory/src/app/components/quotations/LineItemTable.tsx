import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label, Badge } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import type { QuotationLineItemCreate, QuotationLineItem } from '../../types/quotation.types';

import { ItemPickerSelect } from './ItemPickerSelect';

interface PickerResponse {
  items: QuotationLineItem[];
}

interface LineItemTableProps {
  items: QuotationLineItemCreate[];
  onItemsChange: (items: QuotationLineItemCreate[]) => void;
  readonly?: boolean;
  showFulfillmentStatus?: boolean;
  disabled?: boolean;
  initialItemsData?: QuotationLineItem[];
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
  tax_template_id: null,
  tax_rate: 0,
  tax_amount: 0,
  total_amount: 0,
  sort_order: 0,
};

interface LineItemWithMetadata extends QuotationLineItemCreate {
  itemData?: QuotationLineItem;
  validationError?: string;
}

export function LineItemTable({ items, onItemsChange, readonly = false, disabled = false, initialItemsData }: LineItemTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [itemsWithMetadata, setItemsWithMetadata] = React.useState<LineItemWithMetadata[]>([]);
  const [itemsCache, setItemsCache] = React.useState<Map<string, QuotationLineItem>>(() => {
    // Initialize cache with initial items data if provided (for edit mode)
    const initialCache = new Map<string, QuotationLineItem>();
    if (initialItemsData) {
      initialItemsData.forEach(item => {
        initialCache.set(item.item_id, item);
      });
    }
    return initialCache;
  });

  // Search function for ItemPickerSelect
  const searchItems = React.useCallback(async (query: string): Promise<QuotationLineItem[]> => {
    if (!accessToken) return [];

    const response = await fetch(`${environment.apiCoreUrl}/items/picker?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data: PickerResponse = await response.json();

    // Cache the items for later use
    setItemsCache(prevCache => {
      const newCache = new Map(prevCache);
      data.items.forEach(item => {
        newCache.set(item.id, item);
      });
      return newCache;
    });

    return data.items;
  }, [accessToken]);

  // Label formatter
  const itemLabelFormatter = React.useCallback(
    (item: QuotationLineItem) => `${item.item_name} (${item.item_code})`,
    []
  );

  // Update cache when initialItemsData changes
  React.useEffect(() => {
    if (initialItemsData) {
      setItemsCache(prevCache => {
        const newCache = new Map(prevCache);
        initialItemsData.forEach(item => {
          newCache.set(item.item_id, item);
        });
        return newCache;
      });
    }
  }, [initialItemsData]);

  // Sync items with metadata from cache
  React.useEffect(() => {
    const enriched = items.map(item => {
      const itemData = itemsCache.get(item.item_id);
      return { ...item, itemData };
    });
    setItemsWithMetadata(enriched);
  }, [items, itemsCache]);

  const validateQuantity = (qty: number, itemData?: QuotationLineItem): string | undefined => {
    if (!itemData) return undefined;

    if (itemData.min_order_qty && qty < itemData.min_order_qty) {
      return `Minimum order quantity is ${itemData.min_order_qty}`;
    }
    if (itemData.max_order_qty && qty > itemData.max_order_qty) {
      return `Maximum order quantity is ${itemData.max_order_qty}`;
    }
    if (itemData.stock_levels?.quantity_available && qty > itemData.stock_levels.quantity_available) {
      return `Only ${itemData.stock_levels.quantity_available} units available`;
    }
    return undefined;
  };

  const computeDiscountAmount = (amount: number, discountType: string, discountValue: number): number => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Number((amount * discountValue / 100).toFixed(2));
    }
    return Math.min(discountValue, amount);
  };

  const calculateTaxAndTotal = (item: QuotationLineItemCreate, itemData?: QuotationLineItem): QuotationLineItemCreate => {
    const amount = Number(item.qty) * Number(item.rate);
    const discountType = (item.discount_type || 'percentage') as 'flat' | 'percentage';
    const discountVal = Number(item.discount_value ?? 0);
    const discountAmount = computeDiscountAmount(amount, discountType, discountVal);
    const netAmount = amount - discountAmount;

    let taxRate = 0;
    let taxTemplateId: string | null = null;
    if (itemData?.tax_info) {
      taxTemplateId = itemData.tax_info.id;
      taxRate = itemData.tax_info.breakup.reduce((sum: number, tax: { rate: number }) => sum + tax.rate, 0);
    }
    const taxAmount = (netAmount * taxRate) / 100;
    const totalAmount = netAmount + taxAmount;

    return {
      ...item,
      amount,
      discount_type: discountType,
      discount_value: discountVal,
      discount_amount: Number(discountAmount.toFixed(2)),
      tax_template_id: taxTemplateId,
      tax_rate: taxRate,
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: Number(totalAmount.toFixed(2)),
    };
  };

  const handleItemChange = (index: number, field: keyof QuotationLineItemCreate, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate fields when item is selected
    if (field === 'item_id') {
      const selectedItem = value && typeof value === 'string' ? itemsCache.get(value) : undefined;
      if (selectedItem) {
        updated[index].uom = selectedItem.uom;
        updated[index].rate = parseFloat(selectedItem.standard_rate || '0') || 0;
        updated[index].qty = selectedItem.min_order_qty || 1;
        // Recalculate with tax
        updated[index] = calculateTaxAndTotal(updated[index], selectedItem);
      }
    }

    // Recalculate when qty, rate, or discount changes
    if (field === 'qty' || field === 'rate' || field === 'discount_type' || field === 'discount_value') {
      const itemData = itemsCache.get(updated[index].item_id);
      updated[index] = calculateTaxAndTotal(updated[index], itemData);
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
        {itemsWithMetadata.map((item, index) => {
          const validationError = validateQuantity(Number(item.qty), item.itemData);
          const baseAmount = item.amount || 0;
          const taxAmount = item.tax_amount || 0;
          const totalAmount = item.total_amount || 0;

          return (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={disabled}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              {/* Row 1: Item Name, Item Group */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Item Name *</Label>
                  <ItemPickerSelect value={item.item_id}
                    onValueChange={(v) => handleItemChange(index, 'item_id', v)}
                    searchItems={searchItems}
                    labelFormatter={itemLabelFormatter}
                    valueKey="id"
                    placeholder="Select an item..."
                    disabled={disabled}
                    searchPlaceholder="Search items..."
                    minSearchLength={2}
                    selectedItemData={item.itemData || null}/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Item Group</Label>
                  <Input value={item.itemData?.item_group?.name || '-'}
                    disabled
                    className="bg-muted"/>
                </div>
              </div>

              {/* Row 2: Quantity, UOM */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantity *</Label>
                  <Input type="number"
                    min={item.itemData?.min_order_qty || 1}
                    max={item.itemData?.max_order_qty}
                    step="0.01"
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                    disabled={disabled}
                    required
                    className={validationError ? 'border-destructive' : ''}/>
                  {validationError && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{validationError}</span>
                    </div>
                  )}
                  {item.itemData && (
                    <p className="text-xs text-muted-foreground">
                      Min: {item.itemData.min_order_qty}, Max: {item.itemData.max_order_qty}, Available: {item.itemData.stock_levels?.quantity_available || 0}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UOM *</Label>
                  <Input value={item.uom}
                    onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                    placeholder="pcs"
                    disabled
                    className="bg-muted"
                    required/>
                </div>
              </div>

              {/* Row 3: Rate, Discount */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Rate *</Label>
                  <Input type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                    disabled={disabled}
                    required/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Discount</Label>
                  <div className="flex gap-2">
                    <select
                      className="flex h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={(item.discount_type || 'percentage') as string}
                      onChange={(e) => handleItemChange(index, 'discount_type', e.target.value as 'flat' | 'percentage')}
                      disabled={disabled}
                    >
                      <option value="percentage">%</option>
                      <option value="flat">Flat</option>
                    </select>
                    <Input
                      type="number"
                      min="0"
                      step={item.discount_type === 'percentage' ? '1' : '0.01'}
                      value={item.discount_value ?? ''}
                      onChange={(e) => handleItemChange(index, 'discount_value', e.target.value === '' ? 0 : Number(e.target.value))}
                      disabled={disabled}
                      placeholder={item.discount_type === 'percentage' ? '0' : '0.00'}
                      className="flex-1"
                    />
                  </div>
                  {(item.discount_amount && Number(item.discount_amount) > 0) && (
                    <p className="text-xs text-muted-foreground">
                      Discount: −₹{Number(item.discount_amount).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Tax */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1" />
                <div className="space-y-1">
                  <Label className="text-xs">Tax ({item.tax_rate ? `${item.tax_rate}%` : '0%'})</Label>
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1 min-h-[40px] items-center p-2 border rounded-md bg-muted">
                      {item.itemData?.tax_info?.breakup && item.itemData.tax_info.breakup.length > 0 ? (
                        item.itemData.tax_info.breakup.map((tax, taxIndex) => (
                          <Badge key={taxIndex} variant="secondary" className="text-xs">
                            {tax.rule_name}: {tax.rate}%
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tax</span>
                      )}
                    </div>
                    {item.tax_amount ? (
                      <p className="text-xs text-muted-foreground">
                        Tax Amount: ₹{taxAmount}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Row 5: Amount (before discount/tax), Total Amount */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Amount (Before discount & tax)</Label>
                  <Input value={Number(baseAmount).toFixed(2)}
                    disabled
                    className="font-medium bg-muted"/>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Amount</Label>
                  <Input value={totalAmount}
                    disabled
                    className="font-bold bg-primary/10"/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
