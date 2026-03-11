import * as React from 'react';

import { Plus } from 'lucide-react';

import { DataTable, type DataTableProps } from './DataTable';

export interface EditableDataTableProps<TData, TValue>
  extends Omit<DataTableProps<TData, TValue>, 'data'> {
  data: TData[];
  onDataChange: (data: TData[]) => void;
  enableAddRow?: boolean;
  enableDeleteRow?: boolean;
  newRowTemplate?: TData;
  addRowLabel?: string;
  heading?: string;
}

function TableHeader({ heading, showAddButton, onAdd, addRowLabel }: {
  heading?: string;
  showAddButton: boolean;
  onAdd: () => void;
  addRowLabel: string;
}) {
  if (!heading && !showAddButton) return null;
  return (
    <div className="flex items-center justify-between">
      {heading ? <h3 className="text-lg font-semibold">{heading}</h3> : <span />}
      {showAddButton && (
        <button type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          {addRowLabel}
        </button>
      )}
    </div>
  );
}

export function EditableDataTable<TData, TValue>({
  data,
  onDataChange,
  columns,
  config,
  enableAddRow = false,
  enableDeleteRow = false,
  newRowTemplate,
  addRowLabel = 'Add Item',
  heading = 'Line Items',
  ...props
}: EditableDataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data);
  // Track whether the last change was internal to skip the sync-back effect
  const internalChangeRef = React.useRef(false);

  // Sync external data changes only — skip when we caused the change ourselves
  React.useEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    setTableData(data);
  }, [data]);

  const updateData = React.useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      setTableData((old) => {
        const newData = old.map((row, index) => {
          if (index === rowIndex) {
            return { ...row, [columnId]: value };
          }
          return row;
        });
        internalChangeRef.current = true;
        onDataChange(newData);
        return newData;
      });
    },
    [onDataChange]
  );

  const addRow = React.useCallback(() => {
    if (newRowTemplate) {
      const newData = [...tableData, newRowTemplate];
      internalChangeRef.current = true;
      setTableData(newData);
      onDataChange(newData);
    }
  }, [tableData, newRowTemplate, onDataChange]);

  const deleteRow = React.useCallback(
    (rowIndex: number) => {
      const newData = tableData.filter((_, index) => index !== rowIndex);
      internalChangeRef.current = true;
      setTableData(newData);
      onDataChange(newData);
    },
    [tableData, onDataChange]
  );

  // Merge consumer meta with our updateData/deleteRow meta
  const enhancedConfig = React.useMemo(
    () => ({
      ...config,
      meta: {
        ...(config?.meta || {}),
        updateData,
        ...(enableDeleteRow ? { deleteRow } : {}),
      },
    }),
    [config, updateData, deleteRow, enableDeleteRow]
  );

  const showAddButton = enableAddRow && !!newRowTemplate;

  return (
    <div className="space-y-4">
      <TableHeader heading={heading} showAddButton={showAddButton} onAdd={addRow} addRowLabel={addRowLabel} />
      <DataTable data={tableData} columns={columns} config={enhancedConfig} {...props} />
    </div>
  );
}
