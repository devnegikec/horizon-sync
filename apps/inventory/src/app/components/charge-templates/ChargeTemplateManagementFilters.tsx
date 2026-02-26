import * as React from 'react';
import { Search } from 'lucide-react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

interface ChargeTemplateManagementFiltersProps {
  filters: {
    search: string;
    charge_type: 'all' | string;
    is_active: 'all' | 'true' | 'false';
  };
  onFilterChange: (key: string, value: string) => void;
}

export function ChargeTemplateManagementFilters({
  filters,
  onFilterChange,
}: ChargeTemplateManagementFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by template code or name..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="w-full md:w-48 space-y-2">
        <Label htmlFor="charge_type">Charge Type</Label>
        <Select value={filters.charge_type} onValueChange={(v) => onFilterChange('charge_type', v)}>
          <SelectTrigger id="charge_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Shipping">Shipping</SelectItem>
            <SelectItem value="Handling">Handling</SelectItem>
            <SelectItem value="Packaging">Packaging</SelectItem>
            <SelectItem value="Insurance">Insurance</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-48 space-y-2">
        <Label htmlFor="is_active">Status</Label>
        <Select value={filters.is_active} onValueChange={(v) => onFilterChange('is_active', v)}>
          <SelectTrigger id="is_active">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
