import * as React from 'react';

import { CalendarIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

export interface DatePickerProps {
  value?: string; // ISO date string: YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  id?: string;
  className?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Pick a date',
      disabled,
      required,
      min,
      max,
      id,
      className,
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge forwarded ref with local ref
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const formattedDisplay = React.useMemo(() => {
      if (!value) return null;
      const [year, month, day] = value.split('-');
      if (!year || !month || !day) return null;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }, [value]);

    const handleOpenPicker = () => {
      inputRef.current?.showPicker?.();
      inputRef.current?.focus();
    };

    return (
      <div className={cn('relative', className)}>
        {/* Hidden native date input — handles the actual picker */}
        <input ref={inputRef}
          id={id}
          type="date"
          value={value ?? ''}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="sr-only absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-hidden="true"/>

        {/* Input-styled trigger */}
        <button type="button"
          disabled={disabled}
          onClick={handleOpenPicker}
          className={cn(
            'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-muted-foreground/60',
          )}
          aria-label={formattedDisplay ?? placeholder}>
          <span className="truncate text-left">{formattedDisplay ?? placeholder}</span>
          <CalendarIcon className="ml-auto h-4 w-4 shrink-0 text-primary" />
        </button>
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
