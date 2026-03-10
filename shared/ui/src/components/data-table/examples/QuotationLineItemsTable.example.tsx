import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { Button } from '../../ui/button';
import { EditableCell, EditableNumberCell } from '../EditableCell';
import { EditableDataTable } from '../EditableDataTable';

// Type definition for Quotation Line Item
export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuotationLineItemsTableProps {
  items: QuotationLineItem[];
  onItemsChange: (items: QuotationLineItem[]) => void;
  disabled?: boolean;
}

export function QuotationLineItemsTable({
  items,
  onItemsChange,
  disabled = false,
}: QuotationLineItemsTableProps) {
  // Auto-calculate total when quantity or unitPrice changes
  const handleDataChange = React.useCallback(
    (newData: QuotationLineItem[]) => {
      const updatedData = newData.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      onItemsChange(updatedData);
    },
    [onItemsChange]
  );

  const columns = React.useMemo<ColumnDef<QuotationLineItem>[]>(
    () => [
      {
        accessorKey: 'description',
        header: 'Description',
        cell: disabled ? undefined : EditableCell,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: disabled ? undefined : EditableNumberCell,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: disabled
          ? undefined
          : (props) => <EditableNumberCell {...props} />,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <div className="text-right font-medium">${value.toFixed(2)}</div>;
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
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [disabled]
  );

  const newRowTemplate: QuotationLineItem = {
    id: `temp-${Date.now()}`,
    description: '',
    quantity: 1,
    unitPrice: 0,
    total: 0,
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
    />
  );
}

// Example usage component
export function QuotationLineItemsExample() {
  const [items, setItems] = React.useState<QuotationLineItem[]>([
    {
      id: '1',
      description: 'Product A',
      quantity: 2,
      unitPrice: 100,
      total: 200,
    },
    {
      id: '2',
      description: 'Product B',
      quantity: 1,
      unitPrice: 150,
      total: 150,
    },
  ]);

  const grandTotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quotation Line Items</h2>
      
      <QuotationLineItemsTable items={items} onItemsChange={setItems} />

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Current Data:</h3>
        <pre className="bg-muted p-4 rounded-md overflow-auto">
          {JSON.stringify(items, null, 2)}
        </pre>
      </div>
    </div>
  );
}
