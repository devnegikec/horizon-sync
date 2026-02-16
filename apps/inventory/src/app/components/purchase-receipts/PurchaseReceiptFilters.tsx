import { Search } from 'lucide-react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import type { PurchaseReceiptFilters as Filters } from '../../types/purchase-receipt.types';

interface PurchaseReceiptFiltersProps {
  filters: Partial<Filters>;
  setFilters: (filters: Partial<Filters>) => void;
}

export function PurchaseReceiptFilters({ filters, setFilters }: PurchaseReceiptFiltersProps) {
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, reference_id: value, page: 1 });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-lg border bg-card p-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by Purchase Order ID..."
            value={filters.reference_id || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
