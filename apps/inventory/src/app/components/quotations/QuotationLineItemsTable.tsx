import * as React from 'react';

import { type CellContext, type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, EditableCell, EditableDataTable, EditableNumberCell, Input } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';
import { getCurrencySymbol } from '../../types/currency.types';
import type { QuotationLineItemCreate, QuotationLineItem } from '../../types/quotation.types';

import { ItemPickerSelect } from './ItemPickerSelect';
import { SummaryFooterRows } from './SummaryFooterRows';

interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
  getItemData?: (itemId: string) => QuotationLineItem | undefined;
  searchItems?: (query: string) => Promise<QuotationLineItem[]>;
  itemLabelFormatter?: (item: QuotationLineItem) => string;
  disabled?: boolean;
  currency?: string;
}

interface PickerResponse {
  items: QuotationLineItem[];
}

export interface DocumentDiscountControls {
  type: 'flat' | 'percentage';
  value: string;
  onTypeChange: (value: string) => void;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export interface QuotationSummary {
  /** Sum of line amounts (qty × rate) */
  subtotalAmount: number;
  /** Sum of line tax amounts */
  subtotalTax: number;
  /** Sum of line totals (before document-level discount) */
  subtotalTotal: number;
  /** Sum of line-level discount amounts */
  subtotalLineDiscount: number;
  /** Document-level discount amount (computed) */
  discountAmount: number;
  /** After document discount */
  grandTotal: number;
  /** When provided, discount-on-total dropdown + input are rendered in the footer Discount column */
  documentDiscount?: DocumentDiscountControls;
}

interface QuotationLineItemsTableProps {
  items: QuotationLineItemCreate[];
  onItemsChange: (items: QuotationLineItemCreate[]) => void;
  disabled?: boolean;
  currency?: string;
  /** When provided, footer rows (Subtotal, Discount, Grand Total) are shown aligned with table columns */
  summary?: QuotationSummary;
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

function getQtyError(qty: number, itemData: QuotationLineItem): { message: string; color: string } | null {
  const min = itemData.min_order_qty;
  const max = itemData.max_order_qty;
  const available = itemData.stock_levels?.quantity_available;
  if (min != null && min > 0 && qty < min) return { message: `Below min (${min})`, color: 'hsl(0 84% 60%)' };
  if (max != null && max > 0 && qty > max) return { message: `Exceeds max (${max})`, color: 'hsl(0 84% 60%)' };
  if (available != null && qty > available) return { message: `Exceeds available (${available})`, color: 'hsl(25 95% 53%)' };
  return null;
}

function QtyValidationError({ qty, itemData }: { qty: number; itemData: QuotationLineItem | undefined }) {
  if (!itemData || !qty || qty <= 0) return null;
  const error = getQtyError(qty, itemData);
  if (!error) return null;
  return (
    <div className="flex items-center gap-1 text-[10px] leading-tight mt-0.5" style={{ color: error.color }}>
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>{error.message}</span>
    </div>
  );
}

// Quantity cell: editable number + hints + validation
function QuantityCellComponent({ getValue, row, column, table, cell, renderValue }: CellContext<QuotationLineItemCreate, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const itemId = row.original.item_id;
  const itemData = meta?.getItemData?.(itemId);
  const qty = Number(getValue()) || 0;
  const cellProps = { getValue, row, column, table, cell, renderValue };

  return (
    <div>
      <EditableNumberCell {...cellProps} />
      <QtyHints itemData={itemData} />
      {itemData && qty > 0 && <QtyValidationError qty={qty} itemData={itemData} />}
    </div>
  );
}

// Compute line discount amount from type, value and line amount (so display is always correct)
function computeLineDiscountAmount(lineAmount: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number((lineAmount * discountValue / 100).toFixed(2));
  return Math.min(discountValue, lineAmount);
}

// Editable discount: type (%, flat) + value; show computed amount below so it reflects correctly
function DiscountCellComponent({ row, table }: CellContext<QuotationLineItemCreate, unknown>) {
  const meta = table.options.meta as TableMeta | undefined;
  const disabled = meta?.disabled ?? false;
  const sym = getCurrencySymbol(meta?.currency ?? 'INR');
  const type = (row.original.discount_type || 'percentage') as 'flat' | 'percentage';
  const value = Number(row.original.discount_value ?? 0);
  const lineAmount = Number(row.original.amount ?? 0);
  const discountAmount = computeLineDiscountAmount(lineAmount, type, value);

  if (disabled) {
    if (discountAmount <= 0) return <div className="text-left text-muted-foreground">-</div>;
    return <div className="text-left text-muted-foreground">−{sym}{discountAmount.toFixed(2)}</div>;
  }

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex gap-1 items-center">
        <select className="h-8 w-14 rounded-md border border-input bg-background px-1.5 text-xs"
          value={type}
          onChange={(e) => meta?.updateData?.(row.index, 'discount_type', e.target.value as 'flat' | 'percentage')}
          aria-label="Discount type">
          <option value="percentage">%</option>
          <option value="flat">Flat</option>
        </select>
        <Input type="number"
          min={0}
          step={type === 'percentage' ? 1 : 0.01}
          className="h-8 w-16 text-xs"
          value={value || ''}
          onChange={(e) => meta?.updateData?.(row.index, 'discount_value', e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder="0"
          aria-label="Discount value"/>
      </div>
      {discountAmount > 0 && <div className="text-[10px] text-muted-foreground">−{sym}{discountAmount.toFixed(2)}</div>}
    </div>
  );
}

// Tax breakup: percentages only (shown under Tax % column)
function TaxBreakupPercent({ itemData }: { itemData: QuotationLineItem | undefined }) {
  const breakup = itemData?.tax_info?.breakup;
  if (!breakup || breakup.length <= 1) return null;
  return (
    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 space-y-px">
      {breakup.map((tax) => (
        <div key={tax.rule_name} className="text-left">{tax.rule_name} {tax.rate}%</div>
      ))}
    </div>
  );
}

// Tax breakup: amounts only (shown under Tax Amt column)
function TaxBreakupAmount({ itemData, symbol, amount }: { itemData: QuotationLineItem | undefined; symbol: string; amount: number }) {
  const breakup = itemData?.tax_info?.breakup;
  if (!breakup || breakup.length <= 1) return null;
  return (
    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 space-y-px">
      {breakup.map((tax) => {
        const taxAmt = (amount * tax.rate) / 100;
        return <div key={tax.rule_name} className="text-left">{symbol}{taxAmt.toFixed(2)}</div>;
      })}
    </div>
  );
}



export function QuotationLineItemsTable({ items, onItemsChange, disabled = false, currency = 'INR', summary }: QuotationLineItemsTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const itemsCacheRef = React.useRef<Map<string, QuotationLineItem>>(new Map());

  // Seed cache from existing items (edit mode — items carry full QuotationLineItem fields at runtime)
  React.useEffect(() => {
    items.forEach((item) => {
      if (item.item_id && !itemsCacheRef.current.has(item.item_id)) {
        const full = item as unknown as QuotationLineItem;
        if (full.item_name) {
          itemsCacheRef.current.set(item.item_id, full);
        }
      }
    });
  }, [items]);

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

  const computeDiscountAmount = (amount: number, discountType: string, discountValue: number): number => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') return Number((amount * discountValue / 100).toFixed(2));
    return Math.min(discountValue, amount);
  };

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
        const discountType = (item.discount_type || 'percentage') as 'flat' | 'percentage';
        const discountVal = Number(item.discount_value ?? 0);
        const discountAmount = computeDiscountAmount(amount, discountType, discountVal);
        const netAmount = amount - discountAmount;
        const taxAmount = (netAmount * taxRate) / 100;
        const totalAmount = netAmount + taxAmount;
        return {
          ...item,
          qty,
          rate,
          amount,
          discount_type: discountType,
          discount_value: discountVal,
          discount_amount: Number(discountAmount.toFixed(2)),
          tax_template_id: taxTemplateId,
          tax_rate: taxRate,
          tax_amount: Number(taxAmount.toFixed(2)),
          total_amount: Number(totalAmount.toFixed(2)),
        };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  // Currency-aware tax amount cell — tax is on net (amount - discount), breakup uses net amount
  const taxAmountCell = React.useCallback(
    (props: CellContext<QuotationLineItemCreate, unknown>) => {
      const meta = props.table.options.meta as TableMeta | undefined;
      const value = Number(props.getValue()) || 0;
      const itemData = meta?.getItemData?.(props.row.original.item_id);
      const amount = Number(props.row.original.amount) || 0;
      const discountAmount = Number(props.row.original.discount_amount) || 0;
      const netAmount = Math.max(0, amount - discountAmount);
      const sym = getCurrencySymbol(currency);
      return (
        <div className="text-left">
          <div>{sym}{value.toFixed(2)}</div>
          <TaxBreakupAmount itemData={itemData} symbol={sym} amount={netAmount} />
        </div>
      );
    },
    [currency]
  );

  // Tax rate cell with breakup percentages
  const taxRateCell = React.useCallback(
    (props: CellContext<QuotationLineItemCreate, unknown>) => {
      const meta = props.table.options.meta as TableMeta | undefined;
      const v = Number(props.getValue()) || 0;
      const itemData = meta?.getItemData?.(props.row.original.item_id);
      return (
        <div className="text-left">
          <div>{v > 0 ? `${v.toFixed(1)}%` : '-'}</div>
          <TaxBreakupPercent itemData={itemData} />
        </div>
      );
    },
    []
  );

  const columns = React.useMemo<ColumnDef<QuotationLineItemCreate, unknown>[]>(
    () => {
      const sym = getCurrencySymbol(currency);
      return [
      { accessorKey: 'item_id', header: 'Item', cell: ItemPickerCellComponent, size: 250 },
      { accessorKey: 'qty', header: 'Quantity', cell: disabled ? undefined : QuantityCellComponent, size: 120 },
      { accessorKey: 'uom', header: 'UOM', cell: disabled ? undefined : EditableCell, size: 80 },
      { accessorKey: 'rate', header: 'Rate', cell: disabled ? undefined : EditableNumberCell, size: 120 },
      {
        accessorKey: 'amount', header: 'Amount', size: 120,
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-left font-medium">{sym}{v.toFixed(2)}</div>;
        },
      },
      {
        id: 'discount',
        header: 'Discount',
        size: 140,
        cell: DiscountCellComponent,
      },
      { accessorKey: 'tax_rate', header: 'Tax %', size: 80, cell: taxRateCell },
      { accessorKey: 'tax_amount', header: 'Tax Amt', size: 120, cell: taxAmountCell },
      {
        accessorKey: 'total_amount', header: 'Total', size: 120,
        cell: ({ getValue }: CellContext<QuotationLineItemCreate, unknown>) => {
          const v = Number(getValue()) || 0;
          return <div className="text-left font-semibold">{sym}{v.toFixed(2)}</div>;
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
    ];
    },
    [disabled, currency, taxAmountCell, taxRateCell]
  );

  const newRowTemplate: QuotationLineItemCreate = React.useMemo(
    () => ({
      item_id: '',
      qty: 1,
      uom: 'pcs',
      rate: 0,
      amount: 0,
      discount_type: 'percentage',
      discount_value: 0,
      discount_amount: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 0,
      sort_order: items.length + 1,
    }),
    [items.length]
  );

  const tableConfig = React.useMemo(
    () => ({
      showPagination: false,
      enableColumnVisibility: false,
      meta: { getItemData, searchItems, itemLabelFormatter, disabled, currency },
    }),
    [getItemData, searchItems, itemLabelFormatter, disabled, currency]
  );

  const renderFooter = React.useCallback(
    () => (summary ? <SummaryFooterRows summary={summary} currency={currency} /> : null),
    [summary, currency]
  );

  return (
    <div className={disabled ? 'space-y-4 opacity-60 pointer-events-none' : 'space-y-4'}>
      <EditableDataTable data={items}
        columns={columns}
        onDataChange={handleDataChange}
        enableAddRow={!disabled}
        enableDeleteRow={!disabled}
        newRowTemplate={newRowTemplate}
        config={tableConfig}
        renderFooter={summary ? renderFooter : undefined}/>
    </div>
  );
}
