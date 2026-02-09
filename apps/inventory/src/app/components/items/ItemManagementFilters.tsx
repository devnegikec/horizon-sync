import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { ItemFilters } from '../../types/item.types';
import type { ApiItem } from '../../types/items-api.types';

interface ItemManagementFiltersProps {
  filters: ItemFilters;
  setFilters: React.Dispatch<React.SetStateAction<ItemFilters>>;
  itemGroups: Array<{ id: string; name: string }>;
  tableInstance: Table<ApiItem> | null;
}

export function ItemManagementFilters({ 
  filters, 
  setFilters, 
  itemGroups, 
  tableInstance 
}: ItemManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput className="sm:w-80" 
          placeholder="Search by code, name, or group..." 
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
        <div className="flex gap-3">
          <Select value={filters.groupId} 
            onValueChange={(value) => setFilters((prev) => ({ ...prev, groupId: value }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {itemGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} 
            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
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
      </div>
      <div className="flex items-center">
        {tableInstance && <DataTableViewOptions table={tableInstance} />}
      </div>
    </div>
  );
}
