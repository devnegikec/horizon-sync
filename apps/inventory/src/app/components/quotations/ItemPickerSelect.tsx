import * as React from 'react';

import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

interface ItemPickerSelectProps<T> {
  value?: string;
  onValueChange: (value: string) => void;
  searchItems: (query: string) => Promise<T[]>;
  labelFormatter: (item: T) => string;
  valueKey: keyof T;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  minSearchLength?: number;
  selectedItemData?: T | null;
}

interface SearchResultsProps<T> {
  items: T[];
  isSearching: boolean;
  searchLength: number;
  minSearchLength: number;
  value?: string;
  valueKey: keyof T;
  labelFormatter: (item: T) => string;
  onSelect: (item: T) => void;
}

function SearchResults<T>({ items, isSearching, searchLength, minSearchLength, value, valueKey, labelFormatter, onSelect }: SearchResultsProps<T>) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
      </div>
    );
  }

  if (searchLength < minSearchLength) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Type at least {minSearchLength} characters to search...
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">No items found.</div>;
  }

  return (
    <>
      {items.map((item) => {
        const itemValue = String(item[valueKey as keyof T]);
        const isSelected = itemValue === value;
        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        };
        return (
          <div key={itemValue} role="option" aria-selected={isSelected} tabIndex={0} onClick={() => onSelect(item)} onKeyDown={handleKeyDown} className={cn('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground', isSelected && 'bg-accent text-accent-foreground')}>
            <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
            <span className="truncate">{labelFormatter(item)}</span>
          </div>
        );
      })}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ItemPickerSelect<T extends Record<string, any>>({ value, onValueChange, searchItems, labelFormatter, valueKey, placeholder = 'Select item...', disabled = false, searchPlaceholder = 'Search items...', minSearchLength = 2, selectedItemData }: ItemPickerSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [items, setItems] = React.useState<T[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<T | null>(selectedItemData || null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedItemData) {
      setSelectedItem(selectedItemData);
    }
  }, [selectedItemData]);

  React.useEffect(() => {
    if (searchQuery.length < minSearchLength) {
      setItems([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchItems(searchQuery);
        setItems(results);
      } catch (error) {
        console.error('Search failed:', error);
        setItems([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchItems, minSearchLength]);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const handleSelect = React.useCallback(
    (item: T) => {
      onValueChange(String(item[valueKey]));
      setSelectedItem(item);
      setOpen(false);
      setSearchQuery('');
      setItems([]);
    },
    [onValueChange, valueKey]
  );

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery('');
      setItems([]);
    }
  }, []);

  const displayLabel = selectedItem ? labelFormatter(selectedItem) : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', !selectedItem && 'text-muted-foreground')}>
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input ref={inputRef} type="text" placeholder={searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="ml-2 shrink-0 opacity-50 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-1" role="listbox">
          <SearchResults items={items} isSearching={isSearching} searchLength={searchQuery.length} minSearchLength={minSearchLength} value={value} valueKey={valueKey} labelFormatter={labelFormatter} onSelect={handleSelect} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
