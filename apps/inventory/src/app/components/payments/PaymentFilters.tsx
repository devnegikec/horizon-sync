import { useCallback, useMemo, memo } from 'react';
import { Search, X } from 'lucide-react';
import {
  Input,
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import type { PaymentFilters as Filters, PaymentStatus, PaymentMode, PaymentType } from '../../types/payment.types';

interface PaymentFiltersProps {
  filters: Partial<Filters>;
  setFilters: (filters: Partial<Filters>) => void;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PAYMENT_MODE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Modes' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Check', label: 'Check' },
  { value: 'Bank_Transfer', label: 'Bank Transfer' },
];

const PAYMENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'Customer_Payment', label: 'Customer Payment' },
  { value: 'Supplier_Payment', label: 'Supplier Payment' },
];

export const PaymentFilters = memo(function PaymentFilters({ filters, setFilters }: PaymentFiltersProps) {
  const handleSearchChange = useCallback((value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  }, [filters, setFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setFilters({ 
      ...filters, 
      status: value === 'all' ? undefined : (value as PaymentStatus), 
      page: 1 
    });
  }, [filters, setFilters]);

  const handlePaymentModeChange = useCallback((value: string) => {
    setFilters({ 
      ...filters, 
      payment_mode: value === 'all' ? undefined : (value as PaymentMode), 
      page: 1 
    });
  }, [filters, setFilters]);

  const handlePaymentTypeChange = useCallback((value: string) => {
    setFilters({ 
      ...filters, 
      payment_type: value === 'all' ? undefined : (value as PaymentType), 
      page: 1 
    });
  }, [filters, setFilters]);

  const handleUnallocatedChange = useCallback((checked: boolean) => {
    setFilters({ ...filters, has_unallocated: checked || undefined, page: 1 });
  }, [filters, setFilters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: undefined,
      payment_mode: undefined,
      payment_type: undefined,
      search: '',
      has_unallocated: undefined,
      page: 1,
      page_size: filters.page_size || 10,
    });
  }, [filters.page_size, setFilters]);

  const hasActiveFilters = useMemo(() => 
    !!(filters.status || 
    filters.payment_mode || 
    filters.payment_type || 
    filters.search || 
    filters.has_unallocated),
    [filters.status, filters.payment_mode, filters.payment_type, filters.search, filters.has_unallocated]
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reference number..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select 
            value={filters.status || 'all'} 
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.payment_mode || 'all'} 
            onValueChange={handlePaymentModeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by mode" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.payment_type || 'all'} 
            onValueChange={handlePaymentTypeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="has-unallocated"
          checked={filters.has_unallocated || false}
          onCheckedChange={handleUnallocatedChange}
        />
        <label
          htmlFor="has-unallocated"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show only payments with unallocated amount
        </label>
      </div>
    </div>
  );
});
