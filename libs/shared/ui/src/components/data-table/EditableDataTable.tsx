import * as React from 'react';

import { DataTable, type DataTableProps } from './DataTable';

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
        deleteRow: enableDeleteRow ? deleteRow : undefined,
      },
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
      <DataTable data={tableData} columns={columns} config={enhancedConfig} {...props} />
    </div>
  );
}
