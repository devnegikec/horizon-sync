import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { QuotationFilters } from '../../hooks/useQuotationManagement';
import type { Quotation } from '../../types/quotation.types';

interface PickListManagementFiltersProps {
  filters: QuotationFilters;
  setFilters: React.Dispatch<React.SetStateAction<QuotationFilters>>;
  tableInstance: Table<Quotation> | null;
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
          placeholder="Search by quotation #, customer..."
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
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
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

