import type { Table } from '@tanstack/react-table';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import type { Payment } from '../../types/payment';

export interface PaymentFilters {
  search: string;
  status: string;
  payment_mode: string;
  date_from?: string;
  date_to?: string;
}

interface PaymentManagementFiltersProps {
  filters: PaymentFilters;
  setFilters: React.Dispatch<React.SetStateAction<PaymentFilters>>;
  tableInstance: Table<Payment> | null;
}

export function PaymentManagementFilters({
  filters,
  setFilters,
  tableInstance,
}: PaymentManagementFiltersProps) {
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
            placeholder="Search by payment #, party..."
            onSearch={handleSearch}
          />
          <div className="flex gap-3">
            <Select
              value={filters.status}
              onValueChange={(status) => setFilters((prev) => ({ ...prev, status }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.payment_mode}
              onValueChange={(payment_mode) => setFilters((prev) => ({ ...prev, payment_mode }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Payment Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Modes</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
            Payment Date From
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
            Payment Date To
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
