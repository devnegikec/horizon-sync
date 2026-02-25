import { useState, useRef, useEffect } from 'react';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { cn } from '@horizon-sync/ui/lib';

import { useUOMOptions } from '../../hooks/useUOMOptions';

interface UOMSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface UOMListProps {
  loading: boolean;
  options: { label: string; value: string }[];
  value: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function UOMOptionList({ loading, options, value, onSelect, onClose }: UOMListProps) {
  if (loading) {
    return (
      <li className="flex items-center justify-center px-3 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </li>
    );
  }
  if (options.length === 0) {
    return <li className="px-3 py-2 text-sm text-muted-foreground">No results found.</li>;
  }
  return (
    <>
      {options.map((opt) => (
        <li key={opt.value}
          role="option"
          tabIndex={0}
          aria-selected={opt.value === value}
          className={cn(
            'flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
            opt.value === value && 'bg-accent text-accent-foreground font-medium'
          )}
          onClick={() => onSelect(opt.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(opt.value); } if (e.key === 'Escape') onClose(); }}>
          <Check className={cn('mr-2 h-4 w-4 shrink-0', opt.value === value ? 'opacity-100' : 'opacity-0')} />
          {opt.label}
        </li>
      ))}
    </>
  );
}

export function UOMSelect({
  value,
  onValueChange,
  placeholder = 'Select UOM...',
  disabled = false,
  className,
}: UOMSelectProps) {
  const { accessToken } = useUserStore();
  const { options, loading } = useUOMOptions(accessToken ?? '');

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="uom-select-list"
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
            className
          )}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="truncate">{selected ? selected.label : placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom"
        align="start"
        avoidCollisions={false}
        className="p-0"
        style={{ width: triggerRef.current?.offsetWidth ?? 'auto' }}>
        <div className="p-2 border-b">
          <Input ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder={`Search ${placeholder}...`}
            className="h-8"/>
        </div>
        <ul id="uom-select-list"
          className="max-h-[150px] overflow-y-auto py-1"
          role="listbox">
          {loading ? (
            <li className="flex items-center justify-center px-3 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No results found.</li>
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
                onClick={() => handleSelect(opt.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(opt.value); } }}>
                <Check className={cn('mr-2 h-4 w-4 shrink-0', opt.value === value ? 'opacity-100' : 'opacity-0')} />
                {opt.label}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
