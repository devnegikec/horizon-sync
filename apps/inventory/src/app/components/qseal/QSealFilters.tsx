import { Search, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { QSealFilters as Filters } from '../../types/qseal.types';

interface QSealFiltersProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

export function QSealFilters({ filters, setFilters }: QSealFiltersProps) {
  const hasFilters = Boolean(filters.search || (filters.status && filters.status !== 'all'));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center rounded-lg border bg-card p-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products..."
          value={filters.search || ''}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          className="pl-9"/>
      </div>

      <Select value={filters.status || 'all'} onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => setFilters({ search: '', status: 'all' })}>
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
