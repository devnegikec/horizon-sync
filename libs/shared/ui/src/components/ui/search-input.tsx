import * as React from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@horizon-sync/ui/lib';
import { Input } from './input';
import { Button } from './button';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, debounceMs = 300, value: controlledValue, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState('');
    const value = controlledValue !== undefined ? String(controlledValue) : internalValue;
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      onChange?.('');
      onSearch?.('');
    };

    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return (
      <div className={cn('relative', className)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input ref={ref} type="text" className="pl-9 pr-9" value={value} onChange={handleChange} {...props} />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
