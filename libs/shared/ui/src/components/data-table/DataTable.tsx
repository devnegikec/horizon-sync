import * as React from 'react';

import { type ColumnDef, flexRender, type Table } from '@tanstack/react-table';

import { useDataTable, type DataTableConfig } from '../../hooks/useDataTable';
import { Table as TableComponent, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table';

import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableViewOptions } from './DataTableViewOptions';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  config?: DataTableConfig;
  filterPlaceholder?: string;
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
  renderFilters?: () => React.ReactNode;
  renderViewOptions?: (table: Table<TData>) => React.ReactNode;
  fixedHeader?: boolean;
  maxHeight?: string;
  /** Optional footer (e.g. summary rows). Renders inside the same table for column alignment. */
  renderFooter?: () => React.ReactNode;
  /** Optional function to derive a custom className for each row. */
  getRowClassName?: (row: TData) => string | undefined;
  /**
   * Called once the TanStack table instance is available (and again only if it changes).
   * Prefer this over `renderViewOptions` when you only need the instance — passing
   * `renderViewOptions` suppresses the built-in `DataTableViewOptions` menu.
   */
  onTableReady?: (table: Table<TData>) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  config,
  filterPlaceholder,
  renderBulkActions,
  renderFilters,
  renderViewOptions,
  fixedHeader = false,
  maxHeight = '600px',
  renderFooter,
  getRowClassName,
  onTableReady,
}: DataTableProps<TData, TValue>) {
  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    config,
  });

  const reportedTableRef = React.useRef<Table<TData> | null>(null);

  React.useEffect(() => {
    if (!onTableReady || reportedTableRef.current === table) return;
    reportedTableRef.current = table;
    onTableReady(table);
  }, [table, onTableReady]);

  return (
    <div className="space-y-4">
      <DataTableTopBar table={table}
        config={config}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        filterPlaceholder={filterPlaceholder}
        renderBulkActions={renderBulkActions}
        renderFilters={renderFilters}
        renderViewOptions={renderViewOptions} />
      <div className="rounded-md border overflow-hidden">
        <div className={fixedHeader ? 'overflow-auto' : undefined} style={fixedHeader ? { maxHeight } : undefined}>
          <TableComponent>
            <DataTableHeaderRow table={table} fixedHeader={fixedHeader} />
            <DataTableBodyRows table={table} columnCount={columns.length} getRowClassName={getRowClassName} />
            {renderFooter ? (
              <TableFooter className="border-t bg-transparent">
                {renderFooter()}
              </TableFooter>
            ) : null}
          </TableComponent>
        </div>
      </div>
      {config?.showPagination !== false && <DataTablePagination table={table} />}
    </div>
  );
}

function DataTableTopBar<TData>({
  table,
  config,
  globalFilter,
  onGlobalFilterChange,
  filterPlaceholder,
  renderBulkActions,
  renderFilters,
  renderViewOptions,
}: {
  table: Table<TData>;
  config?: DataTableConfig;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  filterPlaceholder?: string;
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
  renderFilters?: () => React.ReactNode;
  renderViewOptions?: (table: Table<TData>) => React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <DataTableToolbar table={table} globalFilter={globalFilter} onGlobalFilterChange={onGlobalFilterChange} filterPlaceholder={filterPlaceholder} renderBulkActions={renderBulkActions} renderFilters={renderFilters} />
      {config?.enableColumnVisibility && !renderViewOptions && <DataTableViewOptions table={table} />}
      {renderViewOptions && renderViewOptions(table)}
    </div>
  );
}

function DataTableHeaderRow<TData>({ table, fixedHeader }: { table: Table<TData>; fixedHeader: boolean }) {
  return (
    <TableHeader className={fixedHeader ? 'sticky top-0 bg-background z-10' : ''}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

function DataTableBodyRows<TData>({
  table,
  columnCount,
  getRowClassName,
}: {
  table: Table<TData>;
  columnCount: number;
  getRowClassName?: (row: TData) => string | undefined;
}) {
  const rows = table.getRowModel().rows;

  if (!rows.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnCount} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={getRowClassName ? getRowClassName(row.original) : undefined}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
