import * as React from 'react';

import { CalendarIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

import { Button } from './button';

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

    const handleButtonClick = () => {
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

        {/* Styled trigger button */}
        <Button type="button"
          variant="outline"
          disabled={disabled}
          onClick={handleButtonClick}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
          aria-label={formattedDisplay ?? placeholder}>
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {formattedDisplay ?? <span>{placeholder}</span>}
        </Button>
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export { DatePicker };
