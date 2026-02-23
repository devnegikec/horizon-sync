import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Button, EditableCell, EditableDataTable, EditableNumberCell } from '@horizon-sync/ui/components';

import type { QuotationLineItemCreate } from '../../types/quotation.types';

// Define table meta interface
interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
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
  // Auto-calculate amounts when qty, rate, or tax_rate changes
  const handleDataChange = React.useCallback(
    (newData: QuotationLineItemCreate[]) => {
      const updatedData = newData.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        const taxRate = Number(item.tax_rate) || 0;

        const amount = qty * rate;
        const taxAmount = (amount * taxRate) / 100;
        const totalAmount = amount + taxAmount;

        return {
          ...item,
          qty,
          rate,
          amount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        };
      });
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  const columns = React.useMemo<ColumnDef<QuotationLineItemCreate>[]>(
    () => [
      {
        accessorKey: 'item_id',
        header: 'Item ID',
        cell: disabled ? undefined : EditableCell,
        size: 200,
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
