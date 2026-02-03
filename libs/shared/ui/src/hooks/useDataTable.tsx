import * as React from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Checkbox } from '../components/ui/checkbox';

export interface DataTableConfig {
  showSerialNumber?: boolean;
  showPagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  initialPageSize?: number;
}

export interface UseDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  config?: DataTableConfig;
}

export function useDataTable<TData, TValue>({
  data,
  columns,
  config = {},
}: UseDataTableProps<TData, TValue>) {
  const safeData = React.useMemo(() => data ?? [], [data]);
  const safeColumns = React.useMemo(() => columns ?? [], [columns]);
  const {
    showSerialNumber = false,
    showPagination = true,
    enableRowSelection = false,
    enableColumnVisibility = true,
    enableSorting = true,
    enableFiltering = true,
    initialPageSize = 10,
  } = config ?? {};

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const serialNumberColumn: ColumnDef<TData, TValue> = React.useMemo(
    () => ({
      id: 'serial',
      header: 'S.No.',
      cell: ({ row }) => {
        const serialNumber = pagination.pageIndex * pagination.pageSize + row.index + 1;
        return <div className="w-12 text-center font-medium">{serialNumber}</div>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [pagination.pageIndex, pagination.pageSize]
  );

  const selectionColumn: ColumnDef<TData, TValue> = React.useMemo(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    []
  );

  const finalColumns = React.useMemo(() => {
    let cols = [...safeColumns];
    if (showSerialNumber) {
      cols = [serialNumberColumn, ...cols];
    }
    if (enableRowSelection) {
      cols = [selectionColumn, ...cols];
    }
    return cols;
  }, [safeColumns, showSerialNumber, enableRowSelection, serialNumberColumn, selectionColumn]);

  const table = useReactTable({
    data: safeData,
    columns: finalColumns,
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      rowSelection: enableRowSelection ? rowSelection : undefined,
      globalFilter: enableFiltering ? globalFilter : undefined,
      pagination: showPagination ? pagination : undefined,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onGlobalFilterChange: enableFiltering ? setGlobalFilter : undefined,
    onPaginationChange: showPagination ? setPagination : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    enableRowSelection,
    enableSorting,
  });

  const selectedRows = React.useMemo(() => {
    const rows = table.getFilteredSelectedRowModel().rows;
    return Array.isArray(rows) ? rows.map((row) => row.original) : [];
  }, [table, rowSelection]);

  const resetSelection = React.useCallback(() => {
    setRowSelection({});
  }, []);

  const resetFilters = React.useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
  }, []);

  return {
    table,
    selectedRows,
    globalFilter,
    setGlobalFilter,
    resetSelection,
    resetFilters,
  };
}
