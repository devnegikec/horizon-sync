import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { DataTable, type DataTableProps } from './DataTable';

// Define table meta interface for type safety
interface TableMeta<TData = unknown> {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
}

export interface EditableDataTableProps<TData, TValue>
  extends Omit<DataTableProps<TData, TValue>, 'data'> {
  data: TData[];
  onDataChange: (data: TData[]) => void;
  enableAddRow?: boolean;
  enableDeleteRow?: boolean;
  newRowTemplate?: TData;
}

export function EditableDataTable<TData, TValue>({
  data,
  onDataChange,
  columns,
  config,
  enableAddRow = false,
  enableDeleteRow = false,
  newRowTemplate,
  ...props
}: EditableDataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data);

  // Sync external data changes
  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  // Update function that will be passed to table meta
  const updateData = React.useCallback(
    (rowIndex: number, columnId: string, value: unknown) => {
      setTableData((old) => {
        const newData = old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...row,
              [columnId]: value,
            };
          }
          return row;
        });
        onDataChange(newData);
        return newData;
      });
    },
    [onDataChange]
  );

  const addRow = React.useCallback(() => {
    if (newRowTemplate) {
      const newData = [...tableData, newRowTemplate];
      setTableData(newData);
      onDataChange(newData);
    }
  }, [tableData, newRowTemplate, onDataChange]);

  const deleteRow = React.useCallback(
    (rowIndex: number) => {
      const newData = tableData.filter((_, index) => index !== rowIndex);
      setTableData(newData);
      onDataChange(newData);
    },
    [tableData, onDataChange]
  );

  // Enhanced config with meta for updateData
  const enhancedConfig = React.useMemo(
    () => ({
      ...config,
      meta: {
        updateData,
        deleteRow: enableDeleteRow ? deleteRow : undefined,
      } as TableMeta<TData>,
    }),
    [config, updateData, deleteRow, enableDeleteRow]
  );

  return (
    <div className="space-y-4">
      {enableAddRow && newRowTemplate && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addRow}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            Add Row
          </button>
        </div>
      )}
      <DataTable
        data={tableData}
        columns={columns}
        config={enhancedConfig}
        {...props}
      />
    </div>
  );
}
