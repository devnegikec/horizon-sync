import * as React from 'react';

import { Plus, Trash2, AlertCircle } from 'lucide-react';

import { Button, Input, Label, Badge } from '@horizon-sync/ui/components';

import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

// Generic line item interface that all document types should extend
export interface BaseLineItem {
  item_id: string;
  qty: number | string;
  uom: string;
  rate: number | string;
  amount: number | string;
  sort_order: number;
  tax_template_id?: string | null;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
}

// Item data from picker/API
export interface ItemData {
  id: string;
  item_name: string;
  item_code: string;
  item_group?: { name: string };
  uom: string;
  standard_rate?: string;
  min_order_qty?: number;
  max_order_qty?: number;
  stock_levels?: {
    quantity_available: number;
  };
  tax_info?: {
    id: string;
    template_name: string;
    template_code: string;
    is_compound: boolean;
    breakup: Array<{
      rule_name: string;
      tax_type: string;
      rate: number;
      is_compound: boolean;
    }>;
  };
}

export interface EditableLineItemsTableProps<T extends BaseLineItem> {
  items: T[];
  onItemsChange: (items: T[]) => void;
  disabled?: boolean;
  readonly?: boolean;
  initialItemsData?: ItemData[];
  searchItems: (query: string) => Promise<ItemData[]>;
  emptyItem: T;
  // Optional customization
  showTax?: boolean;
  showItemGroup?: boolean;
  validateQuantity?: (qty: number, itemData?: ItemData) => string | undefined;
}

export function EditableLineItemsTable<T extends BaseLineItem>({
  items,
  onItemsChange,
  disabled = false,
  readonly = false,
  initialItemsData = [],
  searchItems,
  emptyItem,
  showTax = true,
  showItemGroup = true,
  validateQuantity,
}: EditableLineItemsTableProps<T>) {
  const [itemsCache, setItemsCache] = React.useState<Map<string, ItemData>>(() => {
    const initialCache = new Map<string, ItemData>();
    initialItemsData.forEach((item) => {
      initialCache.set(item.id, item);
    });
    return initialCache;
  });

  // Update cache when initialItemsData changes
  React.useEffect(() => {
    if (initialItemsData.length > 0) {
      setItemsCache((prevCache) => {
        const newCache = new Map(prevCache);
        initialItemsData.forEach((item) => {
          newCache.set(item.id, item);
        });
        return newCache;
      });
    }
  }, [initialItemsData]);

  const itemLabelFormatter = React.useCallback(
    (item: ItemData) => `${item.item_name} (${item.item_code})`,
    []
  );

  const searchItemsWithCache = React.useCallback(
    async (query: string): Promise<ItemData[]> => {
      const results = await searchItems(query);
      // Cache the items for later use
      setItemsCache((prevCache) => {
        const newCache = new Map(prevCache);
        results.forEach((item) => {
          newCache.set(item.id, item);
        });
        return newCache;
      });
      return results;
    },
    [searchItems]
  );

  const calculateTaxAndTotal = (item: T, itemData?: ItemData): T => {
    const amount = Number(item.qty) * Number(item.rate);
    let taxRate = 0;
    let taxTemplateId: string | null = null;

    if (itemData?.tax_info) {
      taxTemplateId = itemData.tax_info.id;
      taxRate = itemData.tax_info.breakup.reduce((sum, tax) => sum + tax.rate, 0);
    }

    const taxAmount = (amount * taxRate) / 100;
    const totalAmount = amount + taxAmount;

    return {
      ...item,
      amount,
      tax_template_id: taxTemplateId,
      tax_rate: taxRate,
      tax_amount: Number(taxAmount.toFixed(2)),
      total_amount: Number(totalAmount.toFixed(2)),
    };
  };

  const handleItemChange = (index: number, field: keyof T, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate fields when item is selected
    if (field === 'item_id') {
      const selectedItem = value && typeof value === 'string' ? itemsCache.get(value) : undefined;
      if (selectedItem) {
        updated[index].uom = selectedItem.uom;
        updated[index].rate = parseFloat(selectedItem.standard_rate || '0') || 0;
        updated[index].qty = selectedItem.min_order_qty || 1;
        updated[index] = calculateTaxAndTotal(updated[index], selectedItem);
      }
    }

    // Recalculate amounts when qty or rate changes
    if (field === 'qty' || field === 'rate') {
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
        {items.map((item, index) => {
          const itemData = itemsCache.get(item.item_id);
          return (
            <EditableLineItemRow key={index}
              item={item}
              index={index}
              itemData={itemData}
              disabled={disabled}
              showTax={showTax}
              showItemGroup={showItemGroup}
              validateQuantity={validateQuantity}
              canRemove={items.length > 1}
              onItemChange={handleItemChange}
              onRemove={removeItem}
              searchItems={searchItemsWithCache}
              itemLabelFormatter={itemLabelFormatter}/>
          );
        })}
      </div>
    </div>
  );
}

// Separate component for each line item row to reduce complexity
interface EditableLineItemRowProps<T extends BaseLineItem> {
  item: T;
  index: number;
  itemData?: ItemData;
  disabled: boolean;
  showTax: boolean;
  showItemGroup: boolean;
  validateQuantity?: (qty: number, itemData?: ItemData) => string | undefined;
  canRemove: boolean;
  onItemChange: (index: number, field: keyof T, value: string | number) => void;
  onRemove: (index: number) => void;
  searchItems: (query: string) => Promise<ItemData[]>;
  itemLabelFormatter: (item: ItemData) => string;
}

function EditableLineItemRow<T extends BaseLineItem>({
  item,
  index,
  itemData,
  disabled,
  showTax,
  showItemGroup,
  validateQuantity,
  canRemove,
  onItemChange,
  onRemove,
  searchItems,
  itemLabelFormatter,
}: EditableLineItemRowProps<T>) {
  const validationError = validateQuantity ? validateQuantity(Number(item.qty), itemData) : undefined;
  const baseAmount = Number(item.amount || 0);
  const taxAmount = Number(item.tax_amount || 0);
  const totalAmount = Number(item.total_amount || 0);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} disabled={disabled}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <ItemSelectionFields
        item={item}
        index={index}
        itemData={itemData}
        disabled={disabled}
        showItemGroup={showItemGroup}
        onItemChange={onItemChange}
        searchItems={searchItems}
        itemLabelFormatter={itemLabelFormatter}
      />

      <QuantityFields
        item={item}
        index={index}
        itemData={itemData}
        disabled={disabled}
        validationError={validationError}
        onItemChange={onItemChange}
      />

      <PricingFields
        item={item}
        index={index}
        itemData={itemData}
        disabled={disabled}
        showTax={showTax}
        taxAmount={taxAmount}
        onItemChange={onItemChange}
      />

      <TotalFields baseAmount={baseAmount} totalAmount={totalAmount} />
    </div>
  );
}

// Sub-components to reduce complexity
interface ItemSelectionFieldsProps<T extends BaseLineItem> {
  item: T;
  index: number;
  itemData?: ItemData;
  disabled: boolean;
  showItemGroup: boolean;
  onItemChange: (index: number, field: keyof T, value: string | number) => void;
  searchItems: (query: string) => Promise<ItemData[]>;
  itemLabelFormatter: (item: ItemData) => string;
}

function ItemSelectionFields<T extends BaseLineItem>({
  item,
  index,
  itemData,
  disabled,
  showItemGroup,
  onItemChange,
  searchItems,
  itemLabelFormatter,
}: ItemSelectionFieldsProps<T>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">Item Name *</Label>
        <ItemPickerSelect
          value={item.item_id}
          onValueChange={(v) => onItemChange(index, 'item_id' as keyof T, v)}
          searchItems={searchItems}
          labelFormatter={itemLabelFormatter}
          valueKey="id"
          placeholder="Select an item..."
          disabled={disabled}
          searchPlaceholder="Search items..."
          minSearchLength={2}
          selectedItemData={itemData || null}
        />
      </div>
      {showItemGroup && (
        <div className="space-y-1">
          <Label className="text-xs">Item Group</Label>
          <Input value={itemData?.item_group?.name || '-'} disabled className="bg-muted" />
        </div>
      )}
    </div>
  );
}

interface QuantityFieldsProps<T extends BaseLineItem> {
  item: T;
  index: number;
  itemData?: ItemData;
  disabled: boolean;
  validationError?: string;
  onItemChange: (index: number, field: keyof T, value: string | number) => void;
}

function QuantityFields<T extends BaseLineItem>({
  item,
  index,
  itemData,
  disabled,
  validationError,
  onItemChange,
}: QuantityFieldsProps<T>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">Quantity *</Label>
        <Input
          type="number"
          min={itemData?.min_order_qty || 1}
          max={itemData?.max_order_qty}
          step="0.01"
          value={item.qty}
          onChange={(e) => onItemChange(index, 'qty' as keyof T, Number(e.target.value))}
          disabled={disabled}
          required
          className={validationError ? 'border-destructive' : ''}
        />
        {validationError && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{validationError}</span>
          </div>
        )}
        {itemData && (
          <p className="text-xs text-muted-foreground">
            Min: {itemData.min_order_qty}, Max: {itemData.max_order_qty}, Available:{' '}
            {itemData.stock_levels?.quantity_available || 0}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-xs">UOM *</Label>
        <Input
          value={item.uom}
          onChange={(e) => onItemChange(index, 'uom' as keyof T, e.target.value)}
          placeholder="pcs"
          disabled
          className="bg-muted"
          required
        />
      </div>
    </div>
  );
}

interface PricingFieldsProps<T extends BaseLineItem> {
  item: T;
  index: number;
  itemData?: ItemData;
  disabled: boolean;
  showTax: boolean;
  taxAmount: number;
  onItemChange: (index: number, field: keyof T, value: string | number) => void;
}

function PricingFields<T extends BaseLineItem>({
  item,
  index,
  itemData,
  disabled,
  showTax,
  taxAmount,
  onItemChange,
}: PricingFieldsProps<T>) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">Rate *</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.rate}
          onChange={(e) => onItemChange(index, 'rate' as keyof T, Number(e.target.value))}
          disabled={disabled}
          required
        />
      </div>
      {showTax && (
        <div className="space-y-1">
          <Label className="text-xs">Tax ({item.tax_rate ? `${item.tax_rate}%` : '0%'})</Label>
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1 min-h-[40px] items-center p-2 border rounded-md bg-muted">
              {itemData?.tax_info?.breakup && itemData.tax_info.breakup.length > 0 ? (
                itemData.tax_info.breakup.map((tax, taxIndex) => (
                  <Badge key={taxIndex} variant="secondary" className="text-xs">
                    {tax.rule_name}: {tax.rate}%
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tax</span>
              )}
            </div>
            {item.tax_amount ? (
              <p className="text-xs text-muted-foreground">Tax Amount: ₹{taxAmount.toFixed(2)}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

interface TotalFieldsProps {
  baseAmount: number;
  totalAmount: number;
}

function TotalFields({ baseAmount, totalAmount }: TotalFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs">Amount (Before Tax)</Label>
        <Input value={baseAmount.toFixed(2)} disabled className="font-medium bg-muted" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Total Amount</Label>
        <Input value={totalAmount.toFixed(2)} disabled className="font-bold bg-primary/10" />
      </div>
    </div>
  );
}
