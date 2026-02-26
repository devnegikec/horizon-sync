import * as React from 'react';
import { Search } from 'lucide-react';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

interface TaxTemplateManagementFiltersProps {
  filters: {
    search: string;
    tax_category: 'all' | 'Input' | 'Output';
    is_active: 'all' | 'true' | 'false';
  };
  onFilterChange: (key: string, value: string) => void;
}

export function TaxTemplateManagementFilters({
  filters,
  onFilterChange,
}: TaxTemplateManagementFiltersProps) {
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
        <Label htmlFor="tax_category">Tax Category</Label>
        <Select value={filters.tax_category} onValueChange={(v) => onFilterChange('tax_category', v)}>
          <SelectTrigger id="tax_category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Input">Input (Purchase)</SelectItem>
            <SelectItem value="Output">Output (Sales)</SelectItem>
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
