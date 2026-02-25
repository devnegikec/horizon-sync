import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Button, EditableDataTable, EditableNumberCell, EditableCell } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import type { StockEntryItem } from '../../types/stock.types';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

/** Minimal item shape returned by the /items/picker endpoint */
interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  standard_rate: string | null;
}

interface PickerResponse {
  items: PickerItem[];
}

interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
  getItemData?: (itemId: string) => PickerItem | undefined;
  searchItems?: (query: string) => Promise<PickerItem[]>;
  itemLabelFormatter?: (item: PickerItem) => string;
  disabled?: boolean;
  showSourceWarehouse?: boolean;
  showTargetWarehouse?: boolean;
}

/** Row shape for the editable table */
export interface StockEntryLineRow {
  item_id: string;
  qty: number;
  uom: string;
  basic_rate: number;
  amount: number;
  sort_order: number;
}

interface StockEntryLineItemsTableProps {
  items: StockEntryLineRow[];
  onItemsChange: (items: StockEntryLineRow[]) => void;
  disabled?: boolean;
}

const defaultLabelFormatter = (item: PickerItem) => item.item_name ?? '';
const defaultSearchItems = async () => [] as PickerItem[];

function handleItemSelection(meta: TableMeta, rowIndex: number, newItemId: string) {
  meta.updateData?.(rowIndex, 'item_id', newItemId);
  const selectedItem = meta.getItemData?.(newItemId);
  if (selectedItem) {
    setTimeout(() => {
      meta.updateData?.(rowIndex, 'uom', selectedItem.uom || 'pcs');
      meta.updateData?.(rowIndex, 'basic_rate', parseFloat(selectedItem.standard_rate || '0') || 0);
    }, 0);
  }
}

function DisabledItemCell({ itemId, meta }: { itemId: string; meta: TableMeta }) {
  const itemData = meta.getItemData?.(itemId);
  const label = itemData ? (meta.itemLabelFormatter ?? defaultLabelFormatter)(itemData) : itemId;
  return <div className="px-2 py-1">{label}</div>;
}

function ItemPickerCellComponent({ getValue, row, table }: CellContext<StockEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = getValue() as string;

  if (!meta || meta.disabled) {
    return meta ? <DisabledItemCell itemId={itemId} meta={meta} /> : <div className="px-2 py-1">{itemId}</div>;
  }

  const itemData = meta.getItemData?.(itemId);

  return (
    <ItemPickerSelect value={itemId}
      onValueChange={(id) => handleItemSelection(meta, row.index, id)}
      searchItems={meta.searchItems ?? defaultSearchItems}
      labelFormatter={meta.itemLabelFormatter ?? defaultLabelFormatter}
      valueKey="id"
      placeholder="Select item..."
      searchPlaceholder="Search items..."
      minSearchLength={2}
      selectedItemData={itemData || null} />
  );
}

export function StockEntryLineItemsTable({ items, onItemsChange, disabled = false }: StockEntryLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const itemsCacheRef = React.useRef<Map<string, PickerItem>>(new Map());

  const searchItems = React.useCallback(async (query: string): Promise<PickerItem[]> => {
    if (!accessToken) return [];
    const response = await fetch(`${environment.apiCoreUrl}/items/picker?search=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data: PickerResponse = await response.json();
    data.items.forEach(item => { itemsCacheRef.current.set(item.id, item); });
    return data.items;
  }, [accessToken]);

  const itemLabelFormatter = React.useCallback(
    (item: PickerItem) => `${item.item_name} (${item.item_code})`,
    []
  );

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    []
  );

  const handleDataChange = React.useCallback(
    (newData: StockEntryLineRow[]) => {
      const updated = newData.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.basic_rate) || 0;
        return { ...item, qty, basic_rate: rate, amount: qty * rate };
      });
      onItemsChange(updated);
    },
    [onItemsChange]
  );

  const columns = React.useMemo<ColumnDef<StockEntryLineRow, unknown>[]>(
    () => [
      { accessorKey: 'item_id', header: 'Item', cell: ItemPickerCellComponent, size: 250 },
      { accessorKey: 'qty', header: 'Quantity', cell: disabled ? undefined : EditableNumberCell, size: 100 },
      { accessorKey: 'uom', header: 'UOM', cell: disabled ? undefined : EditableCell, size: 80 },
      { accessorKey: 'basic_rate', header: 'Rate', cell: disabled ? undefined : EditableNumberCell, size: 120 },
      {
        accessorKey: 'amount', header: 'Amount', size: 120,
        cell: ({ getValue }: CellContext<StockEntryLineRow, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-left font-medium">{v.toFixed(2)}</div>;
        },
      },
      {
        id: 'actions', header: '', size: 50,
        cell: ({ row, table: tbl }: CellContext<StockEntryLineRow, unknown>) => {
          if (disabled) return null;
          const meta = tbl.options.meta as TableMeta;
          return (
            <Button variant="ghost" size="sm" onClick={() => meta?.deleteRow?.(row.index)} type="button">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [disabled]
  );

  const newRowTemplate: StockEntryLineRow = React.useMemo(
    () => ({ item_id: '', qty: 1, uom: 'pcs', basic_rate: 0, amount: 0, sort_order: items.length + 1 }),
    [items.length]
  );

  const tableConfig = React.useMemo(
    () => ({
      showPagination: false,
      enableColumnVisibility: false,
      meta: { getItemData, searchItems, itemLabelFormatter, disabled },
    }),
    [getItemData, searchItems, itemLabelFormatter, disabled]
  );

  return (
    <div className={disabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
      <EditableDataTable data={items}
        columns={columns}
        onDataChange={handleDataChange}
        enableAddRow={!disabled}
        enableDeleteRow={!disabled}
        newRowTemplate={newRowTemplate}
        config={tableConfig} />
    </div>
  );
}
