import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@horizon-sync/ui/lib';

interface ItemPickerSelectProps<T> {
  items: T[];
  value?: string;
  onValueChange: (value: string) => void;
  labelFormatter: (item: T) => string;
  valueKey: keyof T;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  searchPlaceholder?: string;
}

export function ItemPickerSelect<T extends Record<string, any>>({
  items,
  value,
  onValueChange,
  labelFormatter,
  valueKey,
  placeholder = 'Select item...',
  disabled = false,
  isLoading = false,
  searchPlaceholder = 'Search items...',
}: ItemPickerSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => String(item[valueKey]) === value);

  // Client-side filtering
  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const label = labelFormatter(item).toLowerCase();
      return label.includes(query);
    });
  }, [items, searchQuery, labelFormatter]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setOpen(!open)}
        disabled={disabled || isLoading}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          !selectedItem && 'text-muted-foreground'
        )}
      >
        <span className="truncate">
          {isLoading
            ? 'Loading...'
            : selectedItem
            ? labelFormatter(selectedItem)
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No items found.
              </div>
            ) : (
              filteredItems.map((item) => {
                const itemValue = String(item[valueKey]);
                const isSelected = itemValue === value;

                return (
                  <div
                    key={itemValue}
                    onClick={() => {
                      onValueChange(itemValue);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{labelFormatter(item)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
