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

    return (
      <div className={cn('relative', className)}>
        {/* Native date input — transparent overlay; opens the native picker in all browsers */}
        <input ref={inputRef}
          id={id}
          type="date"
          value={value ?? ''}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={formattedDisplay ?? placeholder} />

        {/* Input-styled display (clicks pass through to the native input) */}
        <div aria-hidden="true"
          className={cn(
            'pointer-events-none flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
            !value && 'text-muted-foreground/60',
            disabled && 'cursor-not-allowed opacity-50',
            'peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
          )}>
          <span className="truncate text-left">{formattedDisplay ?? placeholder}</span>
          <CalendarIcon className="ml-auto h-4 w-4 shrink-0 text-primary" />
        </div>
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
