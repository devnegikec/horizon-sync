import { Search } from 'lucide-react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import type { RFQFilters as RFQFiltersType } from '../../types/rfq.types';

interface RFQFiltersProps {
  filters: Partial<RFQFiltersType>;
  setFilters: (filters: Partial<RFQFiltersType>) => void;
}

export function RFQFilters({ filters, setFilters }: RFQFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search RFQs..."
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => setFilters({ ...filters, status: value as any, page: 1 })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="SENT">Sent</SelectItem>
          <SelectItem value="PARTIALLY_RESPONDED">Partially Responded</SelectItem>
          <SelectItem value="FULLY_RESPONDED">Fully Responded</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
