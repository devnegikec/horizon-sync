import * as React from 'react';

import { Check, ChevronsUpDown, Search, X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

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

interface DropdownItemProps<T> {
  item: T;
  isSelected: boolean;
  labelFormatter: (item: T) => string;
  onSelect: () => void;
}

function DropdownItem<T>({ item, isSelected, labelFormatter, onSelect }: DropdownItemProps<T>) {
  return (
    <div role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground'
      )}>
      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
      <span className="truncate">{labelFormatter(item)}</span>
    </div>
  );
}

interface DropdownContentProps<T> {
  items: T[];
  isSearching: boolean;
  searchQuery: string;
  minSearchLength: number;
  searchPlaceholder: string;
  value?: string;
  valueKey: keyof T;
  labelFormatter: (item: T) => string;
  onSearchChange: (query: string) => void;
  onItemSelect: (item: T) => void;
  dropdownPosition: { top: number; left: number; width: number };
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DropdownContent<T extends Record<string, any>>({
  items,
  isSearching,
  searchQuery,
  minSearchLength,
  searchPlaceholder,
  value,
  valueKey,
  labelFormatter,
  onSearchChange,
  onItemSelect,
  dropdownPosition,
  dropdownRef,
}: DropdownContentProps<T>) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Focus input after mount without using autoFocus
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={dropdownRef}
      role="listbox"
      tabIndex={-1}
      className="fixed z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"/>
        {searchQuery && (
          <button type="button"
            onClick={() => onSearchChange('')}
            className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto p-1">
        {isSearching ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        ) : searchQuery.length < minSearchLength ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Type at least {minSearchLength} characters to search...
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No items found.</div>
        ) : (
          items.map((item) => {
            const itemValue = String(item[valueKey]);
            return (
              <DropdownItem key={itemValue}
                item={item}
                isSelected={itemValue === value}
                labelFormatter={labelFormatter}
                onSelect={() => onItemSelect(item)}/>
            );
          })
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ItemPickerSelect<T extends Record<string, any>>({
  value,
  onValueChange,
  searchItems,
  labelFormatter,
  valueKey,
  placeholder = 'Select item...',
  disabled = false,
  searchPlaceholder = 'Search items...',
  minSearchLength = 2,
  selectedItemData,
}: ItemPickerSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [items, setItems] = React.useState<T[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<T | null>(selectedItemData || null);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Debounced search
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

  // Update selected item when value or selectedItemData changes
  React.useEffect(() => {
    if (selectedItemData) {
      setSelectedItem(selectedItemData);
    } else if (value && items.length > 0) {
      const found = items.find((i) => String(i[valueKey]) === value);
      if (found) {
        setSelectedItem(found);
      }
    }
  }, [value, items, valueKey, selectedItemData]);

  // Update dropdown position when opening
  React.useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemSelect = React.useCallback(
    (item: T) => {
      onValueChange(String(item[valueKey]));
      setSelectedItem(item);
      setOpen(false);
      setSearchQuery('');
    },
    [onValueChange, valueKey]
  );

  return (
    <div className="relative">
      <button ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setOpen(!open);
        }}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          !selectedItem && 'text-muted-foreground'
        )}>
        <span className="truncate">{selectedItem ? labelFormatter(selectedItem) : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open &&
        createPortal(
          <DropdownContent items={items}
            isSearching={isSearching}
            searchQuery={searchQuery}
            minSearchLength={minSearchLength}
            searchPlaceholder={searchPlaceholder}
            value={value}
            valueKey={valueKey}
            labelFormatter={labelFormatter}
            onSearchChange={setSearchQuery}
            onItemSelect={handleItemSelect}
            dropdownPosition={dropdownPosition}
            dropdownRef={dropdownRef}/>,
          document.body
        )}
    </div>
  );
}
