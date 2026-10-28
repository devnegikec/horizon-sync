import * as React from 'react';

import { type ColumnDef, flexRender, type Row, type Table } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { useDataTable, type DataTableConfig } from '../../hooks/useDataTable';
import { cn } from '../../lib';
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
  /** Optional row activation handler for detail-first tables. */
  onRowClick?: (row: TData) => void;
  /**
   * Opt-in sub-rows: return the child rows of a row (or null/undefined when it
   * has none). Enables collapsible rows rendered indented underneath the parent.
   */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** When sub-rows are enabled, start with every parent expanded. Default: false. */
  defaultExpanded?: boolean;
  /**
   * Called once the TanStack table instance is available (and again only if it changes).
   * Prefer this over `renderViewOptions` when you only need the instance — passing
   * `renderViewOptions` suppresses the built-in `DataTableViewOptions` menu.
   */
  onTableReady?: (table: Table<TData>) => void;
}

/**
 * Whether the top toolbar has anything to render. Defaults mirror
 * `useDataTable` (filtering + column visibility are on unless disabled), so an
 * omitted `config` does not accidentally hide the default controls.
 */
function hasToolbarContent(
  renderFilters: unknown,
  renderBulkActions: unknown,
  renderViewOptions: unknown,
  enableFiltering = true,
  enableColumnVisibility = true,
): boolean {
  if (renderFilters || renderBulkActions || renderViewOptions) return true;
  if (enableFiltering) return true;
  return enableColumnVisibility && !renderViewOptions;
}

/** Scroll-container props applied to the table body when `fixedHeader` is set. */
function scrollAreaProps(fixedHeader: boolean, maxHeight: string): { className?: string; style?: React.CSSProperties } {
  if (!fixedHeader) return {};
  return { className: 'overflow-auto', style: { maxHeight } };
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
  onRowClick,
  getSubRows,
  defaultExpanded = false,
  onTableReady,
}: DataTableProps<TData, TValue>) {
  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data,
    columns,
    config,
    getSubRows,
    defaultExpanded,
  });

  const subRowsEnabled = typeof getSubRows === 'function';
  const showToolbar = hasToolbarContent(renderFilters, renderBulkActions, renderViewOptions, config?.enableFiltering, config?.enableColumnVisibility);
  const scrollArea = scrollAreaProps(fixedHeader, maxHeight);

  // The expand/collapse toggle and depth indentation belong to the first *data*
  // cell, skipping the synthetic selection/serial columns the hook prepends.
  const expandableColumnId = React.useMemo(() => {
    if (!subRowsEnabled) return undefined;
    return table.getVisibleLeafColumns().find((column) => column.id !== 'select' && column.id !== 'serial')?.id;
  }, [subRowsEnabled, table]);

  const reportedTableRef = React.useRef<Table<TData> | null>(null);

  React.useEffect(() => {
    if (!onTableReady || reportedTableRef.current === table) return;
    reportedTableRef.current = table;
    onTableReady(table);
  }, [table, onTableReady]);

  return (
    <div className="space-y-4">
      {showToolbar && (
        <DataTableTopBar table={table}
          config={config}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          filterPlaceholder={filterPlaceholder}
          renderBulkActions={renderBulkActions}
          renderFilters={renderFilters}
          renderViewOptions={renderViewOptions}/>
      )}
      <div className="rounded-md border overflow-hidden">
        <div {...scrollArea}>
          <TableComponent>
            <DataTableHeaderRow table={table} fixedHeader={fixedHeader} />
            <DataTableBodyRows table={table}
              columnCount={columns.length}
              getRowClassName={getRowClassName}
              onRowClick={onRowClick}
              subRowsEnabled={subRowsEnabled}
              expandableColumnId={expandableColumnId}/>
            {renderFooter ? <TableFooter className="border-t bg-transparent">{renderFooter()}</TableFooter> : null}
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
      <DataTableToolbar table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={onGlobalFilterChange}
        filterPlaceholder={filterPlaceholder}
        renderBulkActions={renderBulkActions}
        renderFilters={renderFilters}/>
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
            <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
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
  onRowClick,
  subRowsEnabled,
  expandableColumnId,
}: {
  table: Table<TData>;
  columnCount: number;
  getRowClassName?: (row: TData) => string | undefined;
  onRowClick?: (row: TData) => void;
  subRowsEnabled: boolean;
  expandableColumnId?: string;
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
        <TableRow key={row.id}
          data-state={row.getIsSelected() && 'selected'}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          onKeyDown={onRowClick ? (event) => {
            // Only activate the row when the row itself owns focus; key events from
            // nested interactive elements (buttons, links, inputs) must bubble to
            // their own handlers instead of opening the row.
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onRowClick(row.original);
            }
          } : undefined}
          className={cn(
            getRowClassName ? getRowClassName(row.original) : undefined,
            onRowClick && 'cursor-pointer hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring',
            // Sub-rows render as a compact, indented band under their parent.
            subRowsEnabled && row.depth > 0 && 'bg-muted/30 [&>td]:py-1.5',
          )}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {subRowsEnabled && cell.column.id === expandableColumnId ? (
                <DataTableExpandableCell row={row}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</DataTableExpandableCell>
              ) : (
                flexRender(cell.column.columnDef.cell, cell.getContext())
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

/**
 * Wraps the first cell of a row to add an expand/collapse toggle (for rows with
 * children) and indentation based on the row's depth.
 */
function DataTableExpandableCell<TData>({ row, children }: { row: Row<TData>; children: React.ReactNode }) {
  const indent = row.depth * 16;
  const style = indent > 0 ? { paddingLeft: `${indent}px` } : undefined;

  if (!row.getCanExpand()) {
    return <div style={style}>{children}</div>;
  }

  const expanded = row.getIsExpanded();
  return (
    <div className="flex items-start gap-1" style={style}>
      <button type="button"
        onClick={row.getToggleExpandedHandler()}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse row' : 'Expand row'}
        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
