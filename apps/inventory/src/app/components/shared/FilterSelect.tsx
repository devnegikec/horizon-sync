import { useState, useRef, useEffect } from 'react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';

export interface SelectOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Plain strings (value === label) or label/value pairs */
  options: string[] | SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

function normalise(options: string[] | SelectOption[]): SelectOption[] {
  if (options.length === 0) return [];
  return typeof options[0] === 'string'
    ? (options as string[]).map((o) => ({ label: o, value: o }))
    : (options as SelectOption[]);
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  className,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalised = normalise(options);
  const filtered = normalised.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = normalised.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (opt: SelectOption) => {
    onValueChange(opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, opt: SelectOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(opt);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls="filter-select-list"
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          className
        )}>
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('ml-2 shrink-0 opacity-50 transition-transform', open && 'rotate-180')}
          aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown — always below the trigger, inside the DOM flow */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b">
            <Input ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="Search..."
              className="h-8"/>
          </div>
          <ul id="filter-select-list"
            className="max-h-48 overflow-y-auto py-1"
            role="listbox">
            {loading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Loading...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">No results found</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}
                  role="option"
                  tabIndex={0}
                  aria-selected={opt.value === value}
                  className={cn(
                    'flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    opt.value === value && 'bg-accent text-accent-foreground font-medium'
                  )}
                  onClick={() => handleSelect(opt)}
                  onKeyDown={(e) => handleKeyDown(e, opt)}>
                  {opt.value === value ? (
                    <svg xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 shrink-0"
                      aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span className="w-[22px]" aria-hidden="true" />
                  )}
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
