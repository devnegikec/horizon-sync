import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';


import { useUserStore, useCurrencyStore } from '@horizon-sync/store';
import { Button, EditableDataTable } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { getCurrencySymbol } from '../../types/currency.types';
import { itemApi } from '../../utility/api/items';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

/** Minimal item shape returned by the /items/picker endpoint */
interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  qty: number;
  sku?: string | null;
  items_per_master_pack?: number | null;
  packaging_units?: Array<{ items_per_master_pack?: number | null; is_base_unit?: boolean }> | null;
}

interface PickerResponse {
  items: PickerItem[];
}

interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
  getItemData?: (itemId: string) => PickerItem | undefined;
  fetchItemData?: (itemId: string) => Promise<PickerItem | null>;
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
  items_per_master_pack?: number;
  no_of_cases: number;
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

function getMasterPackSize(item: PickerItem | null | undefined): number | null {
  const direct = Number(item?.items_per_master_pack);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const configuredUnit = item?.packaging_units?.find((unit) => Number(unit.items_per_master_pack) > 0);
  const nested = Number(configuredUnit?.items_per_master_pack);
  return Number.isFinite(nested) && nested > 0 ? nested : null;
}

async function handleItemSelection(meta: TableMeta, rowIndex: number, newItemId: string) {
  meta.updateData?.(rowIndex, 'item_id', newItemId);
  let selectedItem = meta.getItemData?.(newItemId);
  if (meta.fetchItemData) {
    selectedItem = (await meta.fetchItemData(newItemId)) ?? selectedItem;
  }
  if (selectedItem) {
    const masterPack = getMasterPackSize(selectedItem) ?? 1;
    setTimeout(() => {
      meta.updateData?.(rowIndex, 'uom', selectedItem.uom || 'pcs');
      meta.updateData?.(rowIndex, 'item_name', selectedItem.item_name || '');
      meta.updateData?.(rowIndex, 'item_code', selectedItem.item_code || '');
      meta.updateData?.(rowIndex, 'sku', selectedItem.sku || '');
      meta.updateData?.(rowIndex, 'items_per_master_pack', masterPack);
      meta.updateData?.(rowIndex, 'no_of_cases', 1);
      meta.updateData?.(rowIndex, 'qty', masterPack);
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
  const intValue = Math.trunc(Number(getValue()) || 0);
  return <div className="px-2 py-1 text-right text-muted-foreground">{String(intValue)}</div>;
}

function MasterPackCellComponent({ getValue }: CellContext<AsnEntryLineRow, unknown>) {
  return <div className="px-2 py-1 text-right text-muted-foreground">{String(Math.trunc(Number(getValue()) || 0))}</div>;
}

function CasesCellComponent({ getValue, row, table }: CellContext<AsnEntryLineRow, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  if (meta?.disabled) return <div className="px-2 py-1 text-right">{String(getValue() ?? 0)}</div>;
  return (
    <input
      type="number"
      min="1"
      step="1"
      value={Number(getValue()) > 0 ? String(getValue()) : ''}
      className="h-8 w-20 rounded-md border bg-background px-2 py-1 text-center text-sm"
      onChange={(event) => {
        const noOfCases = Math.max(1, parseInt(event.target.value, 10) || 1);
        const masterPack = Math.max(1, Number(row.original.items_per_master_pack) || 1);
        meta?.updateData?.(row.index, 'no_of_cases', noOfCases);
        meta?.updateData?.(row.index, 'qty', masterPack * noOfCases);
      }}
    />
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
          qty: row.qty || 0.0,
          uom: row.uom || null,
          items_per_master_pack: row.items_per_master_pack ?? null,
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

  const fetchItemData = React.useCallback(async (itemId: string): Promise<PickerItem | null> => {
    if (!accessToken) return null;
    const item = await itemApi.get(accessToken, itemId) as PickerItem;
    itemsCacheRef.current.set(item.id, item);
    return item;
  }, [accessToken]);

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
        const masterPack = Math.max(1, Number(item.items_per_master_pack) || 1);
        const noOfCases = Math.max(1, Number(item.no_of_cases) || 1);
        const qty = masterPack * noOfCases;
        return { ...item, items_per_master_pack: masterPack, no_of_cases: noOfCases, qty };
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
        accessorKey: 'items_per_master_pack',
        header: 'Items / Master Pack',
        cell: MasterPackCellComponent,
        size: 130,
      },
      {
        accessorKey: 'no_of_cases',
        header: 'Cases',
        cell: CasesCellComponent,
        size: 90,
      },
      {
        accessorKey: 'qty',
        header: () => <div className="space-y-1.5">Quantity</div>,
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
    () => ({ item_id: '', qty: 0, items_per_master_pack: 0, no_of_cases: 0, uom: '-', sort_order: items.length + 1, sku: '' }),
    [items.length]
  );

  /* Disable "Add Item" until all existing rows have valid item_id and qty > 0 */
  const allRowsComplete = React.useMemo(() => {
    if (items.length === 0) return true;
    return items.every((row) => !!row.item_id && Number(row.items_per_master_pack) > 0 && row.no_of_cases > 0 && row.qty > 0);
  }, [items]);

  const tableConfig = React.useMemo(
    () => ({
      showPagination: false,
      enableColumnVisibility: false,
      meta: { getItemData, fetchItemData, searchItems, itemLabelFormatter, disabled, warehouseIdFrom },
    }),
    [getItemData, fetchItemData, searchItems, itemLabelFormatter, disabled, warehouseIdFrom]
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
