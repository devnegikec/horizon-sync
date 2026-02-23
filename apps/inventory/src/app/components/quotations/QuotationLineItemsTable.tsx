import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
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
  getItemData?: (itemId: string) => QuotationLineItem | undefined;
  searchItems?: (query: string) => Promise<QuotationLineItem[]>;
  itemLabelFormatter?: (item: QuotationLineItem) => string;
  disabled?: boolean;
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

function handleItemSelection(meta: TableMeta, rowIndex: number, newItemId: string) {
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

const defaultLabelFormatter = (item: QuotationLineItem) => item.item_name ?? '';
const defaultSearchItems = async () => [] as QuotationLineItem[];

function DisabledItemCell({ itemId, meta }: { itemId: string; meta: TableMeta }) {
  const itemData = meta.getItemData?.(itemId);
  const label = itemData ? (meta.itemLabelFormatter ?? defaultLabelFormatter)(itemData) : itemId;
  return <div className="px-2 py-1">{label}</div>;
}

// Standalone cell component — never recreated by parent re-renders
function ItemPickerCellComponent({ getValue, row, table }: CellContext<QuotationLineItemCreate, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = getValue() as string;

  if (!meta || meta.disabled) {
    return meta ? <DisabledItemCell itemId={itemId} meta={meta} /> : <div className="px-2 py-1">{itemId}</div>;
  }

  const itemData = meta.getItemData?.(itemId);

  return (
    <ItemPickerSelect value={itemId} onValueChange={(id) => handleItemSelection(meta, row.index, id)} searchItems={meta.searchItems ?? defaultSearchItems} labelFormatter={meta.itemLabelFormatter ?? defaultLabelFormatter} valueKey="id" placeholder="Select item..." searchPlaceholder="Search items..." minSearchLength={2} selectedItemData={itemData || null} />
  );
}

export function QuotationLineItemsTable({
  items,
  onItemsChange,
  disabled = false,
  currency = 'INR',
}: QuotationLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const itemsCacheRef = React.useRef<Map<string, QuotationLineItem>>(new Map());

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

    data.items.forEach(item => {
      itemsCacheRef.current.set(item.id, item);
    });

    return data.items;
  }, [accessToken]);

  const itemLabelFormatter = React.useCallback(
    (item: QuotationLineItem) => `${item.item_name} (${item.item_code})`,
    []
  );

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    []
  );

  // Auto-calculate amounts — uses ref so no dependency on cache state
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
    [onItemsChange]
  );

  // Columns are stable — cell functions read everything from table.options.meta
  const columns = React.useMemo<ColumnDef<QuotationLineItemCreate, unknown>[]>(
    () => [
      {
        accessorKey: 'item_id',
        header: 'Item',
        cell: ItemPickerCellComponent,
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
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
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
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const value = Number(getValue()) || 0;
          return <div className="text-right">{value > 0 ? `${value.toFixed(1)}%` : '-'}</div>;
        },
        size: 80,
      },
      {
        accessorKey: 'tax_amount',
        header: 'Tax Amt',
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
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
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
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
        cell: ({ row, table }: CellContext<QuotationLineItemCreate, unknown>) => {
          if (disabled) return null;
          const meta = table.options.meta as TableMeta;
          return (
            <Button variant="ghost" size="sm" onClick={() => meta?.deleteRow?.(row.index)} type="button">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
        size: 60,
      },
    ],
    [disabled, currency]
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

  // Pass helpers via config.meta so cells can access them without re-renders
  const tableConfig = React.useMemo(
    () => ({
      showPagination: false,
      enableColumnVisibility: false,
      meta: {
        getItemData,
        searchItems,
        itemLabelFormatter,
        disabled,
      },
    }),
    [getItemData, searchItems, itemLabelFormatter, disabled]
  );

  return (
    <div className="space-y-4">
      <EditableDataTable data={items} columns={columns} onDataChange={handleDataChange} enableAddRow={!disabled} enableDeleteRow={!disabled} newRowTemplate={newRowTemplate} config={tableConfig} />
    </div>
  );
}
