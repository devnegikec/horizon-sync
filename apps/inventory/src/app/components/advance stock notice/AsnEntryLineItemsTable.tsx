import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';


import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { Button, EditableDataTable } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { getCurrencySymbol } from '../../types/currency.types';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

/** Minimal item shape returned by the /items/picker endpoint */
interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  qty: number;
  sku?: string | null;
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
  warehouseIdFrom?: string;
  warehouseIdTo?: string;
}

/** Row shape for the editable table */
export interface AsnEntryLineRow {
  item_id: string;
  item_name?: string;
  item_code?: string;
  sku?: string;
  qty: number;
  uom: string;
  sort_order: number;
}

interface AsnEntryLineItemsTableProps {
  items: AsnEntryLineRow[];
  onItemsChange: (items: AsnEntryLineRow[]) => void;
  disabled?: boolean;
  /** When set, picker searches are scoped to this warehouse */
  warehouseIdFrom?: string;
  warehouseIdTo?: string;
  renderFooter?: () => React.ReactNode;
}

const defaultLabelFormatter = (item: PickerItem) => item.item_name ?? '';
const defaultSearchItems = async () => [] as PickerItem[];

function handleItemSelection(meta: TableMeta, rowIndex: number, newItemId: string) {
  meta.updateData?.(rowIndex, 'item_id', newItemId);
  const selectedItem = meta.getItemData?.(newItemId);
  if (selectedItem) {
    setTimeout(() => {
      meta.updateData?.(rowIndex, 'uom', selectedItem.uom || 'pcs');
      meta.updateData?.(rowIndex, 'item_name', selectedItem.item_name || '');
      meta.updateData?.(rowIndex, 'item_code', selectedItem.item_code || '');
      meta.updateData?.(rowIndex, 'sku', selectedItem.sku || '');
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

function QtyCellComponent({ getValue, row, table }: CellContext<AsnEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  const intValue = Math.trunc(Number(getValue()) || 0);

  React.useEffect(() => {
    setDraft(String(intValue));
  }, [intValue]);

  const commit = () => {
    setIsEditing(false);
    const parsed = parseInt(draft, 10);
    meta?.updateData?.(row.index, 'qty', Number.isNaN(parsed) ? 0 : parsed);
  };

  if (meta?.disabled) {
    return <div className="px-2 py-1 text-right">{String(intValue)}</div>;
  }

  if (isEditing) {
    return (
      <input
        type="number"
        value={draft}
        autoFocus
        step="1"
        min="0"
        className="h-8 w-full rounded-md border bg-background px-2 py-1 text-right text-sm"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(String(intValue));
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center justify-end text-right"
    >
      {String(intValue)}
    </div>
  );
}

function ItemPickerCellComponent({ getValue, row, table }: CellContext<AsnEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = getValue() as string;

  if (!meta || meta.disabled) {
    // In disabled/view mode, show item_name from row data directly
    const rowItemName = row.original.item_name;
    const rowItemCode = row.original.sku || row.original.item_code;
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

  if (!meta.warehouseIdFrom) {
    return (
      <div className="px-2 py-1.5 flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">⚠ Please select a warehouse above to add items</span>
      </div>
    );
  }

  const itemData = meta.getItemData?.(itemId);

  // CSV-imported rows may have item_name/item_code without an actual item_id.
  // Build a temporary PickerItem so the user sees what to search for.
  const csvPlaceholderItem: PickerItem | null =
    !itemId && (row.original.item_name || row.original.item_code)
      ? {
        id: '',
        item_code: row.original.item_code || '',
        item_name: row.original.item_name || row.original.item_code || '',
        uom: row.original.uom || null,
        qty: row.original.qty || 0,
        sku: row.original.sku || null,
      }
      : null;

  return (
    <ItemPickerSelect value={itemId}
      onValueChange={(id) => handleItemSelection(meta, row.index, id)}
      searchItems={meta.searchItems ?? defaultSearchItems}
      labelFormatter={meta.itemLabelFormatter ?? defaultLabelFormatter}
      valueKey="id"
      placeholder={csvPlaceholderItem ? 'Click to select item…' : 'Search items…'}
      searchPlaceholder={csvPlaceholderItem ? `Search: ${csvPlaceholderItem.item_name}` : 'Search items…'}
      minSearchLength={2}
      selectedItemData={itemData || csvPlaceholderItem} />
  );
}

export function AsnEntryLineItemsTable({ items, onItemsChange, disabled = false, warehouseIdFrom, warehouseIdTo, renderFooter }: AsnEntryLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');
  const itemsCacheRef = React.useRef<Map<string, PickerItem>>(new Map());
  const [cacheVersion, setCacheVersion] = React.useState(0);

  /* Clear items cache when warehouse changes (Asn levels are warehouse-specific) */
  React.useEffect(() => {
    itemsCacheRef.current.clear();
    setCacheVersion((v) => v + 1);
  }, [warehouseIdFrom, warehouseIdTo]);

  /* Pre-seed cache from row data (item_name/item_code from API response).
     Declared AFTER the clear effect so it re-populates the cache in the same render cycle. */
  React.useEffect(() => {
    let seeded = false;
    items.forEach((row) => {
      if (row.item_id && row.item_name && !itemsCacheRef.current.has(row.item_id)) {
        itemsCacheRef.current.set(row.item_id, {
          id: row.item_id,
          item_code: row.item_code || '',
          item_name: row.item_name,
          qty: row.qty || 0,
          uom: row.uom || null,
        });
        seeded = true;
      }
    });
    if (seeded) setCacheVersion((v) => v + 1);
  }, [items, warehouseIdFrom, warehouseIdTo]);

  const searchItems = React.useCallback(async (query: string): Promise<PickerItem[]> => {
    if (!accessToken || !warehouseIdFrom) return [];
    const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}&warehouse_id=${encodeURIComponent(warehouseIdFrom)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch items');
    const data: PickerResponse = await response.json();
    data.items.forEach(item => { itemsCacheRef.current.set(item.id, item); });
    return data.items;
  }, [accessToken, warehouseIdFrom]);

  const itemLabelFormatter = React.useCallback(
    (item: PickerItem) => {
      const code = (item.sku || item.item_code)?.trim();
      return code ? `${item.item_name} (${code})` : item.item_name;
    },
    []
  );

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheVersion]
  );

  const handleDataChange = React.useCallback(
    (newData: AsnEntryLineRow[]) => {
      const updated = newData.map((item) => {
        const qty = Number(item.qty) || 0;
        return { ...item, qty };
      });
      onItemsChange(updated);
    },
    [onItemsChange]
  );

  const columns = React.useMemo<ColumnDef<AsnEntryLineRow, unknown>[]>(
    () => [
      { accessorKey: 'item_id', header: 'Item Name', cell: ItemPickerCellComponent, size: 250 },
      {
        accessorKey: 'sku', header: 'SKU', size: 130,
        cell: ({ row }: CellContext<AsnEntryLineRow, unknown>) => (
          <div className="px-2 py-1 text-sm font-mono text-muted-foreground">
            {row.original.sku || row.original.item_code || '—'}
          </div>
        ),
      },
      {
        accessorKey: 'qty',
        header: () => <div className="px-2 text-right">Quantity</div>,
        cell: QtyCellComponent,
        size: 100,
      },
      {
        accessorKey: 'uom', header: 'UOM', size: 80,
        cell: ({ getValue }: CellContext<AsnEntryLineRow, unknown>) => (
          <div className="px-2 py-1 text-sm text-muted-foreground">{String(getValue() ?? '')}</div>
        ),
      },

      {
        id: 'actions', header: '', size: 50,
        cell: ({ row, table: tbl }: CellContext<AsnEntryLineRow, unknown>) => {
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

  const newRowTemplate: AsnEntryLineRow = React.useMemo(
    () => ({ item_id: '', qty: 1, uom: 'pcs', sort_order: items.length + 1, sku: '' }),
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
      meta: { getItemData, searchItems, itemLabelFormatter, disabled, warehouseIdFrom },
    }),
    [getItemData, searchItems, itemLabelFormatter, disabled, warehouseIdFrom]
  );

  return (
    <div className={disabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
      <EditableDataTable data={items}
        columns={columns}
        onDataChange={handleDataChange}
        enableAddRow={!disabled && allRowsComplete}
        enableDeleteRow={!disabled}
        newRowTemplate={newRowTemplate}
        config={tableConfig}
        renderFooter={renderFooter} />
    </div>
  );
}
