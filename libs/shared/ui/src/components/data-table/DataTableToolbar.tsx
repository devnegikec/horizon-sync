import * as React from 'react';
import { type Table } from '@tanstack/react-table';
import { X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  filterPlaceholder?: string;
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
  renderFilters?: () => React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  filterPlaceholder = 'Search...',
  renderBulkActions,
  renderFilters,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter !== '';
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {hasSelection && renderBulkActions ? (
          renderBulkActions(selectedRows)
        ) : (
          <>
            {renderFilters && renderFilters()}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() => {
                  table.resetColumnFilters();
                  onGlobalFilterChange('');
                }}
                className="h-8 px-2 lg:px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
