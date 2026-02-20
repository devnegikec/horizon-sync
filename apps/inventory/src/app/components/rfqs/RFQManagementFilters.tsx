import * as React from 'react';
import { type Table } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { RFQListItem, RFQManagementFilters as RFQManagementFiltersType } from '../../types/rfq.types';

interface RFQManagementFiltersProps {
  filters: RFQManagementFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<RFQManagementFiltersType>>;
  tableInstance: Table<RFQListItem> | null;
}

export function RFQManagementFilters({ filters, setFilters, tableInstance }: RFQManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search RFQs..."
          value={filters.search || ''}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? undefined : value, page: 1 }))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="partially_responded">Partially Responded</SelectItem>
          <SelectItem value="fully_responded">Fully Responded</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
