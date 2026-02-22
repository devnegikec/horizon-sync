import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';

import type { InvoiceFilters } from '../../hooks/useInvoiceManagement';
import type { Invoice } from '../../types/invoice.types';

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
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by invoice #, party..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <div className="flex gap-3">
          <Select
            value={filters.invoice_type}
            onValueChange={(invoice_type) => setFilters((prev) => ({ ...prev, invoice_type }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partially Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center">{tableInstance && <DataTableViewOptions table={tableInstance} />}</div>
    </div>
  );
}
