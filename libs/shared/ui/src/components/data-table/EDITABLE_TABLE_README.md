# Editable DataTable Components

A set of reusable components for creating inline-editable tables using TanStack React Table and Shadcn/UI.

## Components

### 1. EditableCell Components

Three types of editable cells:

- **EditableCell**: Click to edit, shows text by default
- **EditableCellAlwaysInput**: Always shows input (spreadsheet style)
- **EditableNumberCell**: Specialized for numbers with auto-formatting

### 2. EditableDataTable

A wrapper around the existing `DataTable` component that adds:

- State management for editable data
- `updateData` function passed via table meta
- Add/delete row functionality
- Auto-sync with parent component

## Basic Usage

### Simple Quotation Line Items

```tsx
import { EditableDataTable, EditableCell, EditableNumberCell } from '@horizon-sync/ui/components';
import { type ColumnDef } from '@tanstack/react-table';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

function MyComponent() {
  const [items, setItems] = useState<LineItem[]>([...]);

  const columns: ColumnDef<LineItem>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
      cell: EditableCell,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: EditableNumberCell,
    },
    {
      accessorKey: 'unitPrice',
      header: 'Unit Price',
      cell: EditableNumberCell,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return <div>${value.toFixed(2)}</div>;
      },
    },
  ];

  // Auto-calculate total when quantity or unitPrice changes
  const handleDataChange = (newData: LineItem[]) => {
    const updated = newData.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    setItems(updated);
  };

  return (
    <EditableDataTable
      data={items}
      columns={columns}
      onDataChange={handleDataChange}
      enableAddRow
      enableDeleteRow
      newRowTemplate={{
        id: `temp-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      }}
    />
  );
}
```

## Advanced Usage with Auto-Calculation

```tsx
interface QuotationLineItem {
  id: string;
  item_id: string;
  qty: number;
  rate: number;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount: number;
}

function QuotationForm() {
  const [items, setItems] = useState<QuotationLineItem[]>([...]);

  const handleDataChange = (newData: QuotationLineItem[]) => {
    // Auto-calculate amounts
    const updated = newData.map(item => {
      const amount = item.qty * item.rate;
      const taxAmount = (amount * (item.tax_rate || 0)) / 100;
      const totalAmount = amount + taxAmount;

      return {
        ...item,
        amount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };
    });
    setItems(updated);
  };

  const columns: ColumnDef<QuotationLineItem>[] = [
    {
      accessorKey: 'qty',
      header: 'Quantity',
      cell: EditableNumberCell,
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: EditableNumberCell,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => (
        <div className="text-right">${(getValue() as number).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ getValue }) => (
        <div className="text-right font-bold">
          ${(getValue() as number).toFixed(2)}
        </div>
      ),
    },
  ];

  return (
    <EditableDataTable
      data={items}
      columns={columns}
      onDataChange={handleDataChange}
      enableAddRow
      enableDeleteRow
      newRowTemplate={{
        id: `temp-${Date.now()}`,
        item_id: '',
        qty: 1,
        rate: 0,
        amount: 0,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: 0,
      }}
    />
  );
}
```

## Custom Editable Cell

Create your own editable cell for special cases:

```tsx
import { type CellContext } from '@tanstack/react-table';
import { Select } from '@horizon-sync/ui/components';

function EditableSelectCell<TData>({ getValue, row, column, table }: CellContext<TData, any>) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const onValueChange = (newValue: string) => {
    setValue(newValue);
    const meta = table.options.meta as any;
    if (meta?.updateData) {
      meta.updateData(row.index, column.id, newValue);
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

## Adding Delete Button

```tsx
const columns: ColumnDef<LineItem>[] = [
  // ... other columns
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as any;
      return (
        <Button variant="ghost" size="sm" onClick={() => meta?.deleteRow?.(row.index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
  },
];
```

## Props

### EditableDataTable Props

| Prop                      | Type                      | Description                 |
| ------------------------- | ------------------------- | --------------------------- |
| `data`                    | `TData[]`                 | Array of data items         |
| `columns`                 | `ColumnDef<TData>[]`      | Column definitions          |
| `onDataChange`            | `(data: TData[]) => void` | Callback when data changes  |
| `enableAddRow`            | `boolean`                 | Show "Add Row" button       |
| `enableDeleteRow`         | `boolean`                 | Enable row deletion         |
| `newRowTemplate`          | `TData`                   | Template for new rows       |
| `config`                  | `DataTableConfig`         | DataTable configuration     |
| All other DataTable props |                           | Passed through to DataTable |

### EditableCell Props

Automatically receives from TanStack Table:

- `getValue()`: Get current cell value
- `row`: Row data
- `column`: Column definition
- `table`: Table instance (with meta.updateData)

## Keyboard Shortcuts

- **Enter**: Save and exit edit mode
- **Escape**: Cancel and revert changes
- **Tab**: Move to next cell (browser default)

## Features

✅ Click to edit cells
✅ Auto-save on blur
✅ Keyboard navigation (Enter/Escape)
✅ Number formatting
✅ Auto-calculation support
✅ Add/delete rows
✅ Integrates with existing DataTable
✅ TypeScript support
✅ Tailwind CSS styling

## Examples

See the `examples/` directory for complete working examples:

- `QuotationLineItemsTable.example.tsx` - Basic example
- `AdvancedQuotationTable.example.tsx` - Advanced with tax calculation

## Integration with Existing Forms

```tsx
function QuotationDialog() {
  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_date: '',
    items: [],
  });

  return (
    <form>
      {/* Other form fields */}

      <EditableDataTable
        data={formData.items}
        columns={columns}
        onDataChange={(items) => setFormData((prev) => ({ ...prev, items }))}
        enableAddRow
        enableDeleteRow
        newRowTemplate={emptyItem}
      />

      {/* Grand total */}
      <div>Total: ${formData.items.reduce((sum, item) => sum + item.total, 0)}</div>
    </form>
  );
}
```

## Notes

- The `updateData` function is passed via table `meta` option
- Changes are applied on blur or Enter key
- Escape key reverts changes
- Works seamlessly with existing DataTable features (sorting, filtering, etc.)
- Supports both controlled and uncontrolled patterns
