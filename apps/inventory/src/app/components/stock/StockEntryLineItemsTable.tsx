import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

 
import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { Button, EditableDataTable, EditableNumberCell } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { getCurrencySymbol } from '../../types/currency.types';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

/** Minimal item shape returned by the /items/picker endpoint */
interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  standard_rate: string | null;
  stock_levels?: {
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
  };
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
  warehouseId?: string;
}

/** Row shape for the editable table */
export interface StockEntryLineRow {
  item_id: string;
  item_name?: string;
  item_code?: string;
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
  /** When set, picker searches are scoped to this warehouse */
  warehouseId?: string;
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
  if (itemData) {
    const label = (meta.itemLabelFormatter ?? defaultLabelFormatter)(itemData);
    return <div className="px-2 py-1">{label}</div>;
  }
  // Fallback: check if the row has item_name via the table data
  return <div className="px-2 py-1 text-muted-foreground">{itemId ? '—' : ''}</div>;
}

function QtyCellComponent({ getValue, row, table, ...rest }: CellContext<StockEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = row.original.item_id;
  const stockLevels = itemId ? meta?.getItemData?.(itemId)?.stock_levels : undefined;

  return (
    <div className="flex flex-col gap-0.5">
      {meta?.disabled ? (
        <div className="px-2 py-1">{String(getValue() ?? '')}</div>
      ) : (
        <EditableNumberCell getValue={getValue} row={row} table={table} {...rest} />
      )}
      {stockLevels !== undefined && (
        <span className="px-2 text-[10px] text-muted-foreground leading-tight">
          Avail: {stockLevels.quantity_available}
        </span>
      )}
    </div>
  );
}

function ItemPickerCellComponent({ getValue, row, table }: CellContext<StockEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = getValue() as string;

  if (!meta || meta.disabled) {
    // In disabled/view mode, show item_name from row data directly
    const rowItemName = row.original.item_name;
    const rowItemCode = row.original.item_code;
    if (rowItemName) {
      const label = rowItemCode ? `${rowItemName} (${rowItemCode})` : rowItemName;
      return <div className="px-2 py-1">{label}</div>;
    }
    // Fallback to cache
    if (meta) {
      const itemData = meta.getItemData?.(itemId);
      if (itemData) {
        const label = (meta.itemLabelFormatter ?? defaultLabelFormatter)(itemData);
        return <div className="px-2 py-1">{label}</div>;
      }
    }
    return <div className="px-2 py-1 text-muted-foreground">{itemId ? '—' : ''}</div>;
  }

  if (!meta.warehouseId) {
    return (
      <div className="px-2 py-1.5 flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">⚠ Please select a warehouse above to add items</span>
      </div>
    );
  }

  const itemData = meta.getItemData?.(itemId);

  return (
    <ItemPickerSelect value={itemId}
      onValueChange={(id) => handleItemSelection(meta, row.index, id)}
      searchItems={meta.searchItems ?? defaultSearchItems}
      labelFormatter={meta.itemLabelFormatter ?? defaultLabelFormatter}
      valueKey="id"
      placeholder="Search items..."
      searchPlaceholder="Search items..."
      minSearchLength={2}
      selectedItemData={itemData || null} />
  );
}

export function StockEntryLineItemsTable({ items, onItemsChange, disabled = false, warehouseId }: StockEntryLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');
  const itemsCacheRef = React.useRef<Map<string, PickerItem>>(new Map());
  const [cacheVersion, setCacheVersion] = React.useState(0);

  /* Pre-seed cache from row data (item_name/item_code from API response) */
  React.useEffect(() => {
    let seeded = false;
    items.forEach((row) => {
      if (row.item_id && row.item_name && !itemsCacheRef.current.has(row.item_id)) {
        itemsCacheRef.current.set(row.item_id, {
          id: row.item_id,
          item_code: row.item_code || '',
          item_name: row.item_name,
          uom: row.uom || null,
          standard_rate: row.basic_rate != null ? String(row.basic_rate) : null,
        });
        seeded = true;
      }
    });
    if (seeded) setCacheVersion((v) => v + 1);
  }, [items]);

  /* Clear items cache when warehouse changes (stock levels are warehouse-specific) */
  React.useEffect(() => {
    itemsCacheRef.current.clear();
    setCacheVersion((v) => v + 1);
  }, [warehouseId]);

  const searchItems = React.useCallback(async (query: string): Promise<PickerItem[]> => {
    if (!accessToken || !warehouseId) return [];
    const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}&warehouse_id=${encodeURIComponent(warehouseId)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data: PickerResponse = await response.json();
    data.items.forEach(item => { itemsCacheRef.current.set(item.id, item); });
    return data.items;
  }, [accessToken, warehouseId]);

  const itemLabelFormatter = React.useCallback(
    (item: PickerItem) => `${item.item_name} (${item.item_code})`,
    []
  );

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheVersion]
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
      { accessorKey: 'item_id', header: 'Item Name', cell: ItemPickerCellComponent, size: 250 },
      { accessorKey: 'qty', header: 'Quantity', cell: QtyCellComponent, size: 100 },
      { accessorKey: 'uom', header: 'UOM', size: 80,
        cell: ({ getValue }: CellContext<StockEntryLineRow, unknown>) => (
          <div className="px-2 py-1 text-sm text-muted-foreground">{String(getValue() ?? '')}</div>
        ),
      },
      { accessorKey: 'basic_rate', header: 'Rate', cell: disabled ? undefined : EditableNumberCell, size: 120 },
      {
        accessorKey: 'amount', header: 'Amount', size: 120,
        cell: ({ getValue }: CellContext<StockEntryLineRow, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-left font-medium">{currencySymbol}{v.toFixed(2)}</div>;
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
    [disabled, currencySymbol]
  );

  const newRowTemplate: StockEntryLineRow = React.useMemo(
    () => ({ item_id: '', qty: 1, uom: 'pcs', basic_rate: 0, amount: 0, sort_order: items.length + 1 }),
    [items.length]
  );

  /* Disable "Add Item" until all existing rows have valid item_id and qty > 0 */
  const allRowsComplete = React.useMemo(() => {
    if (items.length === 0) return true;
    return items.every((row) => !!row.item_id && row.qty > 0);
  }, [items]);

  const tableConfig = React.useMemo(
    () => ({
      showPagination: false,
      enableColumnVisibility: false,
      meta: { getItemData, searchItems, itemLabelFormatter, disabled, warehouseId },
    }),
    [getItemData, searchItems, itemLabelFormatter, disabled, warehouseId]
  );

  return (
    <div className={disabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
      <EditableDataTable data={items}
        columns={columns}
        onDataChange={handleDataChange}
        enableAddRow={!disabled && allRowsComplete}
        enableDeleteRow={!disabled}
        newRowTemplate={newRowTemplate}
        config={tableConfig} />
    </div>
  );
}
