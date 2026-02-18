import { Search } from 'lucide-react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import type { MaterialRequestFilters as Filters, MaterialRequestStatus } from '../../types/material-request.types';

interface MaterialRequestFiltersProps {
  filters: Partial<Filters>;
  setFilters: (filters: Partial<Filters>) => void;
}

const STATUS_OPTIONS: Array<{ value: MaterialRequestStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'partially_quoted', label: 'Partially Quoted' },
  { value: 'fully_quoted', label: 'Fully Quoted' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function MaterialRequestFilters({ filters, setFilters }: MaterialRequestFiltersProps) {
  const handleSearchChange = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setFilters({ ...filters, status: value as MaterialRequestStatus | 'all', page: 1 });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-lg border bg-card p-4">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search material requests..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
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
      </div>
    </div>
  );
}
