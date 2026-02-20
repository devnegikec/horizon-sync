import { useState, useEffect, useCallback } from 'react';

import { Search, X } from 'lucide-react';

import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

interface PermissionSearchProps {
  onSearchChange: (query: string) => void;
  onModuleFilter: (module: string | null) => void;
  modules: string[];
  resultCount?: number;
}

export function PermissionSearch({ onSearchChange, onModuleFilter, modules, resultCount }: PermissionSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Debounced search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const handleClear = useCallback(() => {
    setSearchValue('');
    setSelectedModule('all');
    onSearchChange('');
    onModuleFilter(null);
  }, [onSearchChange, onModuleFilter]);

  const handleModuleChange = useCallback(
    (value: string) => {
      setSelectedModule(value);
      onModuleFilter(value === 'all' ? null : value);
    },
    [onModuleFilter]
  );

  const hasActiveFilters = searchValue !== '' || selectedModule !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search permissions by name or code..."
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Module Filter */}
        <Select value={selectedModule} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module} value={module}>
                {module}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Result Count */}
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount === 0 ? 'No permissions found' : `${resultCount} permission${resultCount === 1 ? '' : 's'} found`}
        </p>
      )}
    </div>
  );
}
