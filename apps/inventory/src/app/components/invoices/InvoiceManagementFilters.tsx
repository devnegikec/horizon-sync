import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import type { Invoice } from '../../types/invoice';

export interface InvoiceFilters {
  search: string;
  status: string;
  date_from?: string;
  date_to?: string;
}

interface InvoiceManagementFiltersProps {
  filters: InvoiceFilters;
  setFilters: React.Dispatch<React.SetStateAction<InvoiceFilters>>;
  tableInstance: Table<Invoice> | null;
}

export function InvoiceManagementFilters({
  filters,
  setFilters,
  tableInstance,
}: InvoiceManagementFiltersProps) {
  // Debounce search input (300ms)
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-80"
            placeholder="Search by invoice #, customer..."
            onSearch={handleSearch}
          />
          <div className="flex gap-3">
            <Select
              value={filters.status}
              onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>
      
      {/* Date Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date-from" className="text-sm font-medium">
            Posting Date From
          </Label>
          <Input
            id="date-from"
            type="date"
            className="w-[180px]"
            value={filters.date_from || ''}
            onChange={(e) => 
              setFilters((prev) => ({ 
                ...prev, 
                date_from: e.target.value || undefined 
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date-to" className="text-sm font-medium">
            Posting Date To
          </Label>
          <Input
            id="date-to"
            type="date"
            className="w-[180px]"
            value={filters.date_to || ''}
            onChange={(e) => 
              setFilters((prev) => ({ 
                ...prev, 
                date_to: e.target.value || undefined 
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}
