import * as React from 'react';
import { type ColumnDef, flexRender } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { useDataTable, type DataTableConfig } from '@horizon-sync/ui/hooks/useDataTable';
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
  fixedHeader?: boolean;
  maxHeight?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  config,
  filterPlaceholder,
  renderBulkActions,
  renderFilters,
  fixedHeader = false,
  maxHeight = '600px',
}: DataTableProps<TData, TValue>) {
  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    config,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DataTableToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          filterPlaceholder={filterPlaceholder}
          renderBulkActions={renderBulkActions}
          renderFilters={renderFilters}
        />
        {config?.enableColumnVisibility && <DataTableViewOptions table={table} />}
      </div>
      <div className={fixedHeader ? `rounded-md border` : 'rounded-md border'}>
        <div
          className={fixedHeader ? 'overflow-auto' : undefined}
          style={fixedHeader ? { maxHeight } : undefined}
        >
          <Table>
            <TableHeader className={fixedHeader ? 'sticky top-0 bg-background z-10' : ''}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {config?.showPagination !== false && <DataTablePagination table={table} />}
    </div>
  );
}
