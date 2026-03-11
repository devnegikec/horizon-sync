"use client"

import * as React from 'react';

import { Check, ChevronsUpDown, Search } from 'lucide-react';

import { cn } from '../../lib/utils';

import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  currencies: CurrencyOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When the list has more than this many items, show a searchable popover. Default: 8 */
  searchThreshold?: number;
}

function formatLabel(c: CurrencyOption) {
  return `${c.code} – ${c.symbol} ${c.name}`;
}

/**
 * CurrencySelect — a reusable currency picker.
 *
 * When the number of currencies exceeds `searchThreshold` (default 8),
 * it renders a searchable popover. Otherwise it uses a plain Radix Select.
 */
export function CurrencySelect({
  value,
  onChange,
  currencies,
  placeholder = 'Select currency…',
  disabled = false,
  className,
  searchThreshold = 8,
}: CurrencySelectProps) {
  if (currencies.length > searchThreshold) {
    return (
      <SearchableCurrencySelect value={value}
        onChange={onChange}
        currencies={currencies}
        placeholder={placeholder}
        disabled={disabled}
        className={className} />
    );
  }

  return (
    <SimpleCurrencySelect value={value}
      onChange={onChange}
      currencies={currencies}
      placeholder={placeholder}
      disabled={disabled}
      className={className} />
  );
}

/* ------------------------------------------------------------------ */
/*  Simple Select (small list)                                        */
/* ------------------------------------------------------------------ */

function SimpleCurrencySelect({
  value,
  onChange,
  currencies,
  placeholder,
  disabled,
  className,
}: Omit<CurrencySelectProps, 'searchThreshold'>) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {formatLabel(c)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/*  Searchable Popover (large list)                                   */
/* ------------------------------------------------------------------ */

function SearchableCurrencySelect({
  value,
  onChange,
  currencies,
  placeholder,
  disabled,
  className,
}: Omit<CurrencySelectProps, 'searchThreshold'>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    if (!search) return currencies;
    const q = search.toLowerCase();
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.includes(q)
    );
  }, [currencies, search]);

  const selected = currencies.find((c) => c.code === value);

  // Focus the search input when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="currency-listbox"
          aria-label={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}>
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? formatLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-0">
        {/* Search input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search currency…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0" />
        </div>

        {/* Options list */}
        <div id="currency-listbox" role="listbox" className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No currency found.
            </p>
          )}
          {filtered.map((c) => (
            <button key={c.code}
              type="button"
              role="option"
              aria-selected={value === c.code}
              className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === c.code && 'bg-accent text-accent-foreground'
              )}
              onClick={() => {
                onChange(c.code);
                setOpen(false);
              }}>
              <Check className={cn(
                  'mr-2 h-4 w-4',
                  value === c.code ? 'opacity-100' : 'opacity-0'
                )} />
              {formatLabel(c)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
