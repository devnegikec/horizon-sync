import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, EditableCell, EditableDataTable, EditableNumberCell } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import type { QuotationLineItemCreate, QuotationLineItem } from '../../types/quotation.types';

import { ItemPickerSelect } from './ItemPickerSelect';

// Define table meta interface
interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
}

interface PickerResponse {
  items: QuotationLineItem[];
}

interface QuotationLineItemsTableProps {
  items: QuotationLineItemCreate[];
  onItemsChange: (items: QuotationLineItemCreate[]) => void;
  disabled?: boolean;
  currency?: string;
}

export function QuotationLineItemsTable({
  items,
  onItemsChange,
  disabled = false,
  currency = 'INR',
}: QuotationLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [itemsCache, setItemsCache] = React.useState<Map<string, QuotationLineItem>>(new Map());

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
  // Auto-calculate amounts when qty, rate, or tax_rate changes
  const handleDataChange = React.useCallback(
    (newData: QuotationLineItemCreate[]) => {
      const updatedData = newData.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        
        // Get item data from cache to apply tax
        const itemData = itemsCache.get(item.item_id);
        let taxRate = 0;
        let taxTemplateId: string | null = null;

        if (itemData?.tax_info) {
          taxTemplateId = itemData.tax_info.id;
          taxRate = itemData.tax_info.breakup.reduce((sum, tax) => sum + tax.rate, 0);
        }

        const amount = qty * rate;
        const taxAmount = (amount * taxRate) / 100;
        const totalAmount = amount + taxAmount;

        return {
          ...item,
          qty,
          rate,
          amount,
          tax_template_id: taxTemplateId,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange, itemsCache]
  );

  // Custom cell for item picker
  const ItemPickerCell = React.useCallback(({ getValue, row, column, table }: {
    getValue: () => unknown;
    row: { index: number; original: QuotationLineItemCreate };
    column: { id: string };
    table: { options: { meta?: TableMeta } };
  }) => {
    const itemId = getValue() as string;
    const itemData = itemsCache.get(itemId);

    if (disabled) {
      return <div className="px-2 py-1">{itemData ? itemLabelFormatter(itemData) : itemId}</div>;
    }

    return (
      <ItemPickerSelect value={itemId}
        onValueChange={(newItemId) => {
          const meta = table.options.meta as TableMeta;
          if (meta?.updateData) {
            // First update the item_id
            meta.updateData(row.index, column.id, newItemId);
            
            // Then auto-populate other fields
            const selectedItem = itemsCache.get(newItemId);
            if (selectedItem) {
              // Use setTimeout to ensure the item_id update is processed first
              setTimeout(() => {
                if (meta.updateData) {
                  meta.updateData(row.index, 'uom', selectedItem.uom);
                  meta.updateData(row.index, 'rate', parseFloat(selectedItem.standard_rate || '0') || 0);
                  meta.updateData(row.index, 'qty', selectedItem.min_order_qty || 1);
                }
              }, 0);
            }
          }
        }}
        searchItems={searchItems}
        labelFormatter={itemLabelFormatter}
        valueKey="id"
        placeholder="Select item..."
        searchPlaceholder="Search items..."
        minSearchLength={2}
        selectedItemData={itemData || null}/>
    );
  }, [disabled, itemsCache, searchItems, itemLabelFormatter]);

  const columns = React.useMemo<ColumnDef<QuotationLineItemCreate>[]>(
    () => [
      {
        accessorKey: 'item_id',
        header: 'Item',
        cell: ItemPickerCell,
        size: 250,
      },
      {
        accessorKey: 'qty',
        header: 'Quantity',
        cell: disabled ? undefined : EditableNumberCell,
        size: 100,
      },
      {
        accessorKey: 'uom',
        header: 'UOM',
        cell: disabled ? undefined : EditableCell,
        size: 80,
      },
      {
        accessorKey: 'rate',
        header: 'Rate',
        cell: disabled ? undefined : EditableNumberCell,
        size: 120,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => {
          const value = Number(getValue()) || 0;
          return (
            <div className="text-right font-medium">
              {currency} {value.toFixed(2)}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'tax_rate',
        header: 'Tax %',
        cell: disabled ? undefined : EditableNumberCell,
        size: 80,
      },
      {
        accessorKey: 'tax_amount',
        header: 'Tax Amount',
        cell: ({ getValue }) => {
          const value = Number(getValue()) || 0;
          return (
            <div className="text-right">
              {currency} {value.toFixed(2)}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ getValue }) => {
          const value = Number(getValue()) || 0;
          return (
            <div className="text-right font-semibold">
              {currency} {value.toFixed(2)}
            </div>
          );
        },
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row, table }) => {
          if (disabled) return null;
          const meta = table.options.meta as TableMeta;
          return (
            <Button variant="ghost"
              size="sm"
              onClick={() => meta?.deleteRow?.(row.index)}
              type="button">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
        size: 60,
      },
    ],
    [disabled, currency, ItemPickerCell]
  );

  const newRowTemplate: QuotationLineItemCreate = React.useMemo(
    () => ({
      item_id: '',
      qty: 1,
      uom: 'pcs',
      rate: 0,
      amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      sort_order: items.length + 1,
    }),
    [items.length]
  );

  return (
    <div className="space-y-4">
      <EditableDataTable data={items}
        columns={columns}
        onDataChange={handleDataChange}
        enableAddRow={!disabled}
        enableDeleteRow={!disabled}
        newRowTemplate={newRowTemplate}
        config={{
          showPagination: false,
          enableColumnVisibility: false,
        }}/>
    </div>
  );
}
