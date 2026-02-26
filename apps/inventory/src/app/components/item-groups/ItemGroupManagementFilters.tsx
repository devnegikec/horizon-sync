import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { ItemGroupFilters, ItemGroupListItem } from '../../types/item-group.types';

interface ItemGroupManagementFiltersProps {
  filters: ItemGroupFilters;
  setFilters: React.Dispatch<React.SetStateAction<ItemGroupFilters>>;
  tableInstance: Table<ItemGroupListItem> | null;
}

export function ItemGroupManagementFilters({
  filters,
  setFilters,
  tableInstance,
}: ItemGroupManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-72"
          placeholder="Search by name or code..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center">
        {tableInstance && <DataTableViewOptions table={tableInstance} />}
      </div>
    </div>
  );
}
