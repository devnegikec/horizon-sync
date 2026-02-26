import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { LocalSearch, type SearchResult } from '@horizon-sync/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { ItemFilters } from '../../types/item.types';
import type { ApiItem } from '../../types/items-api.types';

interface ItemManagementFiltersProps {
  filters: ItemFilters;
  setFilters: React.Dispatch<React.SetStateAction<ItemFilters>>;
  itemGroups: Array<{ id: string; name: string }>;
  tableInstance: Table<ApiItem> | null;
  onSearchResults?: (results: SearchResult[]) => void;
}

export function ItemManagementFilters({ 
  filters, 
  setFilters, 
  itemGroups, 
  tableInstance,
  onSearchResults 
}: ItemManagementFiltersProps) {
  
  const handleSearchResults = (results: SearchResult[]) => {
    console.log('[ItemManagementFilters] Search results received:', results.length);
    
    // If we have search results, use them
    if (results.length > 0) {
      // Extract entity IDs from search results
      const searchResultIds = results.map(r => r.entity_id);
      console.log('[ItemManagementFilters] Search result IDs:', searchResultIds);
      
      // Pass results to parent component
      if (onSearchResults) {
        onSearchResults(results);
      }
    } else if (results.length === 0 && onSearchResults) {
      // Empty results from search (not cleared search)
      onSearchResults(results);
    } else {
      // Search was cleared, reset to show all items
      console.log('[ItemManagementFilters] Search cleared, showing all items');
      if (onSearchResults) {
        onSearchResults([]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <LocalSearch
          entityType="items"
          onResultsChange={handleSearchResults}
          placeholder="Search items by name, SKU, or description..."
          className="sm:w-80"
        />
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
