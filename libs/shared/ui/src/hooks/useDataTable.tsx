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

export interface ServerPaginationConfig {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export interface DataTableConfig {
  showSerialNumber?: boolean;
  showPagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  initialPageSize?: number;
  serverPagination?: ServerPaginationConfig;
  meta?: Record<string, unknown>;
}

export interface UseDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  config?: DataTableConfig;
}

// eslint-disable-next-line complexity
export function useDataTable<TData, TValue>({ data, columns, config = {} }: UseDataTableProps<TData, TValue>) {
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
    serverPagination,
  } = config ?? {};

  const isServerPagination = !!serverPagination;

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  
  // For server pagination, use server state; for client pagination, use local state
  const [clientPagination, setClientPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const pagination = React.useMemo(() => {
    if (isServerPagination) {
      return {
        pageIndex: serverPagination.currentPage - 1, // Convert 1-based to 0-based
        pageSize: serverPagination.pageSize,
      };
    }
    return clientPagination;
  }, [isServerPagination, serverPagination, clientPagination]);

  // Handle pagination changes
  const handlePaginationChange = React.useCallback((updater: ((old: PaginationState) => PaginationState) | PaginationState) => {
    if (isServerPagination) {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      const newPage = newPagination.pageIndex + 1; // Convert 0-based to 1-based
      serverPagination.onPageChange(newPage, newPagination.pageSize);
    } else {
      setClientPagination(updater);
    }
  }, [isServerPagination, serverPagination, pagination]);

  const serialNumberColumn: ColumnDef<TData, TValue> = React.useMemo(
    () => ({
      id: 'serial',
      header: 'S.No.',
      cell: ({ row }) => {
        const baseNumber = isServerPagination 
          ? (serverPagination.currentPage - 1) * serverPagination.pageSize
          : pagination.pageIndex * pagination.pageSize;
        const serialNumber = baseNumber + row.index + 1;
        return <div className="w-12 text-center font-medium">{serialNumber}</div>;
      },
      enableSorting: false,
      enableHiding: false,
    }),
    [pagination.pageIndex, pagination.pageSize, isServerPagination, serverPagination],
  );

  const selectionColumn: ColumnDef<TData, TValue> = React.useMemo(
    () => ({
      id: 'select',
      header: ({ table }) => (
        <Checkbox checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
          aria-label="Select all"/>
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(!!checked)} aria-label="Select row" />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    [],
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
    ...(config?.meta ? { meta: config.meta } : {}),
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableFiltering ? columnFilters : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      rowSelection: enableRowSelection ? rowSelection : {},
      globalFilter: enableFiltering ? globalFilter : undefined,
      pagination: showPagination ? pagination : undefined,
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    onGlobalFilterChange: enableFiltering ? setGlobalFilter : undefined,
    onPaginationChange: showPagination ? handlePaginationChange : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: showPagination && !isServerPagination ? getPaginationRowModel() : undefined,
    enableRowSelection,
    enableSorting,
    // Server-side pagination configuration
    manualPagination: isServerPagination,
    pageCount: isServerPagination ? Math.ceil(serverPagination.totalItems / serverPagination.pageSize) : undefined,
  });

  const selectedRows = React.useMemo(() => {
    if (!enableRowSelection) return [];
    try {
      const rowModel = table.getFilteredSelectedRowModel();
      const rows = rowModel?.rows;
      return Array.isArray(rows) ? rows.map((row) => row.original) : [];
    } catch {
      return [];
    }
  }, [table, enableRowSelection]);

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
