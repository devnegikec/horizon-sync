import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Button } from '../../ui/button';
import { EditableNumberCell } from '../EditableCell';
import { EditableDataTable } from '../EditableDataTable';

// Advanced Quotation Line Item with more fields
export interface AdvancedQuotationLineItem {
  id: string;
  item_id: string;
  item_name: string;
  item_code: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
  sort_order: number;
}

interface AdvancedQuotationTableProps {
  items: AdvancedQuotationLineItem[];
  onItemsChange: (items: AdvancedQuotationLineItem[]) => void;
  disabled?: boolean;
  currency?: string;
}

export function AdvancedQuotationTable({
  items,
  onItemsChange,
  disabled = false,
  currency = 'USD',
}: AdvancedQuotationTableProps) {
  // Auto-calculate amounts when qty or rate changes
  const handleDataChange = React.useCallback(
    (newData: AdvancedQuotationLineItem[]) => {
      const updatedData = newData.map((item) => {
        const amount = item.qty * item.rate;
        const taxRate = item.tax_rate || 0;
        const taxAmount = (amount * taxRate) / 100;
        const totalAmount = amount + taxAmount;

        return {
          ...item,
          amount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  const columns = React.useMemo<ColumnDef<AdvancedQuotationLineItem>[]>(
    () => [
      {
        accessorKey: 'sort_order',
        header: '#',
        cell: ({ row }) => <div className="w-8">{row.index + 1}</div>,
      },
      {
        accessorKey: 'item_name',
        header: 'Item',
        cell: ({ getValue, row }) => (
          <div>
            <div className="font-medium">{getValue() as string}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.item_code}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'qty',
        header: 'Quantity',
        cell: disabled ? undefined : EditableNumberCell,
      },
      {
        accessorKey: 'uom',
        header: 'UOM',
        cell: ({ getValue }) => (
          <div className="text-sm">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'rate',
        header: 'Rate',
        cell: disabled ? undefined : EditableNumberCell,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <div className="text-right font-medium">
              {currency} {value.toFixed(2)}
            </div>
          );
        },
      },
      {
        accessorKey: 'tax_rate',
        header: 'Tax %',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined;
          return <div className="text-right">{value ? `${value}%` : '-'}</div>;
        },
      },
      {
        accessorKey: 'tax_amount',
        header: 'Tax Amount',
        cell: ({ getValue }) => {
          const value = getValue() as number | undefined;
          return (
            <div className="text-right">
              {value ? `${currency} ${value.toFixed(2)}` : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <div className="text-right font-bold">
              {currency} {value.toFixed(2)}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row, table }) => {
          if (disabled) return null;
          const meta = table.options.meta as any;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => meta?.deleteRow?.(row.index)}
              disabled={items.length <= 1}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [disabled, currency, items.length]
  );

  const newRowTemplate: AdvancedQuotationLineItem = {
    id: `temp-${Date.now()}`,
    item_id: '',
    item_name: 'New Item',
    item_code: '',
    qty: 1,
    uom: 'pcs',
    rate: 0,
    amount: 0,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 0,
    sort_order: items.length + 1,
  };

  return (
    <EditableDataTable
      data={items}
      columns={columns}
      onDataChange={handleDataChange}
      enableAddRow={!disabled}
      enableDeleteRow={!disabled}
      newRowTemplate={newRowTemplate}
      config={{
        showPagination: false,
        enableColumnVisibility: false,
      }}
      fixedHeader
      maxHeight="500px"
    />
  );
}

// Example usage with totals
export function AdvancedQuotationExample() {
  const [items, setItems] = React.useState<AdvancedQuotationLineItem[]>([
    {
      id: '1',
      item_id: 'item-1',
      item_name: 'Laptop',
      item_code: 'LAP-001',
      qty: 2,
      uom: 'pcs',
      rate: 1000,
      amount: 2000,
      tax_rate: 18,
      tax_amount: 360,
      total_amount: 2360,
      sort_order: 1,
    },
    {
      id: '2',
      item_id: 'item-2',
      item_name: 'Mouse',
      item_code: 'MOU-001',
      qty: 5,
      uom: 'pcs',
      rate: 25,
      amount: 125,
      tax_rate: 18,
      tax_amount: 22.5,
      total_amount: 147.5,
      sort_order: 2,
    },
  ]);

  const totals = React.useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.amount,
        totalTax: acc.totalTax + (item.tax_amount || 0),
        grandTotal: acc.grandTotal + item.total_amount,
      }),
      { subtotal: 0, totalTax: 0, grandTotal: 0 }
    );
  }, [items]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quotation Line Items</h2>
        <div className="text-sm text-muted-foreground">
          {items.length} item(s)
        </div>
      </div>

      <AdvancedQuotationTable
        items={items}
        onItemsChange={setItems}
        currency="$"
      />

      <div className="flex justify-end">
        <div className="w-80 space-y-2 border rounded-lg p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <span className="text-sm">Subtotal:</span>
            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Total Tax:</span>
            <span className="font-medium">${totals.totalTax.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="text-lg font-semibold">Grand Total:</span>
            <span className="text-lg font-bold">
              ${totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
