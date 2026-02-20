import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { SalesOrderFilters } from '../../hooks/useSalesOrderManagement';
import type { SalesOrder } from '../../types/sales-order.types';

interface SalesOrderManagementFiltersProps {
  filters: SalesOrderFilters;
  setFilters: React.Dispatch<React.SetStateAction<SalesOrderFilters>>;
  tableInstance: Table<SalesOrder> | null;
}

export function SalesOrderManagementFilters({
  filters,
  setFilters,
  tableInstance,
}: SalesOrderManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by order #, customer..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <div className="flex gap-3">
          <Select
            value={filters.status}
            onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="partially_delivered">Partially Delivered</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center">
        {tableInstance && <DataTableViewOptions table={tableInstance} />}
      </div>
    </div>
  );
}
