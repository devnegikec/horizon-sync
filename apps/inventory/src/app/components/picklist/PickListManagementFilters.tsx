import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { PickListFilters } from '../../hooks/usePickListManagement';
import type { PickList } from '../../types/pick-list.types';

interface PickListManagementFiltersProps {
  filters: PickListFilters;
  setFilters: React.Dispatch<React.SetStateAction<PickListFilters>>;
  tableInstance: Table<PickList> | null;
}

export function PickListManagementFilters({
  filters,
  setFilters,
  tableInstance,
}: PickListManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput className="sm:w-80"
          placeholder="Search by pick list #, sales order..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
        <div className="flex gap-3">
          <Select value={filters.status}
            onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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

