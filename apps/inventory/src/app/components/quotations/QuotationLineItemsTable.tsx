import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, EditableCell, EditableDataTable, EditableNumberCell } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import type { QuotationLineItemCreate, QuotationLineItem } from '../../types/quotation.types';

import { ItemPickerSelect } from './ItemPickerSelect';

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

// --- Sub-components for cells ---

function DisabledItemCell({ itemId, meta }: { itemId: string; meta: TableMeta }) {
  const itemData = meta.getItemData?.(itemId);
  const label = itemData ? (meta.itemLabelFormatter ?? defaultLabelFormatter)(itemData) : itemId;
  return <div className="px-2 py-1">{label}</div>;
}

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

// Quantity hints showing min/max/available
function QtyHints({ itemData }: { itemData: QuotationLineItem | undefined }) {
  if (!itemData) return null;
  const min = itemData.min_order_qty;
  const max = itemData.max_order_qty;
  const available = itemData.stock_levels?.quantity_available;
  const parts: string[] = [];
  if (min != null && min > 0) parts.push(`Min: ${min}`);
  if (max != null && max > 0) parts.push(`Max: ${max}`);
  if (available != null) parts.push(`Avail: ${available}`);
  if (parts.length === 0) return null;
  return <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{parts.join(' · ')}</div>;
}

function QtyValidationError({ qty, itemData }: { qty: number; itemData: QuotationLineItem | undefined }) {
  if (!itemData || qty === 0) return null;
  const min = itemData.min_order_qty;
  const available = itemData.stock_levels?.quantity_available;
  if (min != null && min > 0 && qty < min) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-destructive leading-tight mt-0.5">
        <AlertTriangle className="h-3 w-3" />
        <span>Below min ({min})</span>
      </div>
    );
  }
  if (available != null && qty > available) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-orange-600 leading-tight mt-0.5">
        <AlertTriangle className="h-3 w-3" />
        <span>Exceeds available ({available})</span>
      </div>
    );
  }
  return null;
}

// Quantity cell: editable number + hints + validation
function QuantityCellComponent({ getValue, row, column, table, cell, renderValue }: CellContext<QuotationLineItemCreate, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemData = meta?.getItemData?.(row.original.item_id);
  const qty = Number(getValue()) || 0;
  const cellProps = { getValue, row, column, table, cell, renderValue };

  return (
    <div>
      <EditableNumberCell {...cellProps} />
      <QtyHints itemData={itemData} />
      <QtyValidationError qty={qty} itemData={itemData} />
    </div>
  );
}

// Tax breakup display for compound taxes
function TaxBreakupDisplay({ itemData, currency, amount }: { itemData: QuotationLineItem | undefined; currency: string; amount: number }) {
  const breakup = itemData?.tax_info?.breakup;
  if (!breakup || breakup.length <= 1) return null;
  return (
    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 space-y-px">
      {breakup.map((tax) => {
        const taxAmt = (amount * tax.rate) / 100;
        return (
          <div key={tax.rule_name} className="flex justify-between gap-2">
            <span>{tax.rule_name} ({tax.rate}%)</span>
            <span>{currency} {taxAmt.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}


export function QuotationLineItemsTable({ items, onItemsChange, disabled = false, currency = 'INR' }: QuotationLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const itemsCacheRef = React.useRef<Map<string, QuotationLineItem>>(new Map());

  const searchItems = React.useCallback(async (query: string): Promise<QuotationLineItem[]> => {
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
    (item: QuotationLineItem) => `${item.item_name} (${item.item_code})`,
    []
  );

  const getItemData = React.useCallback(
    (itemId: string) => itemsCacheRef.current.get(itemId),
    []
  );

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
        return { ...item, qty, rate, amount, tax_template_id: taxTemplateId, tax_rate: taxRate, tax_amount: taxAmount, total_amount: amount + taxAmount };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  // Currency-aware tax amount cell — reads currency from closure
  const taxAmountCell = React.useCallback(
    (props: CellContext<QuotationLineItemCreate, unknown>) => {
      const meta = props.table.options.meta as TableMeta | undefined;
      const value = Number(props.getValue()) || 0;
      const itemData = meta?.getItemData?.(props.row.original.item_id);
      const amount = Number(props.row.original.amount) || 0;
      return (
        <div className="text-right">
          <div>{currency} {value.toFixed(2)}</div>
          <TaxBreakupDisplay itemData={itemData} currency={currency} amount={amount} />
        </div>
      );
    },
    [currency]
  );

  const columns = React.useMemo<ColumnDef<QuotationLineItemCreate, unknown>[]>(
    () => [
      { accessorKey: 'item_id', header: 'Item', cell: ItemPickerCellComponent, size: 250 },
      { accessorKey: 'qty', header: 'Quantity', cell: disabled ? undefined : QuantityCellComponent, size: 120 },
      { accessorKey: 'uom', header: 'UOM', cell: disabled ? undefined : EditableCell, size: 80 },
      { accessorKey: 'rate', header: 'Rate', cell: disabled ? undefined : EditableNumberCell, size: 120 },
      {
        accessorKey: 'amount', header: 'Amount', size: 120,
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-right font-medium">{currency} {v.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: 'tax_rate', header: 'Tax %', size: 80,
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-right">{v > 0 ? `${v.toFixed(1)}%` : '-'}</div>;
        },
      },
      { accessorKey: 'tax_amount', header: 'Tax Amt', size: 120, cell: taxAmountCell },
      {
        accessorKey: 'total_amount', header: 'Total', size: 120,
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-right font-semibold">{currency} {v.toFixed(2)}</div>;
        },
      },
      {
        id: 'actions', header: '', size: 60,
        cell: ({ row, table }: CellContext<QuotationLineItemCreate, unknown>) => {
          if (disabled) return null;
          const meta = table.options.meta as TableMeta;
          return (
            <Button variant="ghost" size="sm" onClick={() => meta?.deleteRow?.(row.index)} type="button">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [disabled, currency, taxAmountCell]
  );

  const newRowTemplate: QuotationLineItemCreate = React.useMemo(
    () => ({ item_id: '', qty: 1, uom: 'pcs', rate: 0, amount: 0, tax_rate: 0, tax_amount: 0, total_amount: 0, sort_order: items.length + 1 }),
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
      <EditableDataTable data={items} columns={columns} onDataChange={handleDataChange} enableAddRow={!disabled} enableDeleteRow={!disabled} newRowTemplate={newRowTemplate} config={tableConfig} />
    </div>
  );
}
