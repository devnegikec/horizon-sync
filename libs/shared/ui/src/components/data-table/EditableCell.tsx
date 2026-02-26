import * as React from 'react';

import { type CellContext } from '@tanstack/react-table';

import { Input } from '../ui/input';

// Define table meta interface for type safety
interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
}

export function EditableCell<TData, TValue>({
  getValue,
  row,
  column,
  table,
}: CellContext<TData, TValue>) {
  const initialValue = getValue();
  const [value, setValue] = React.useState(initialValue);
  const [isEditing, setIsEditing] = React.useState(false);

  // Update local state when external value changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    const meta = table.options.meta as TableMeta;
    if (meta?.updateData) {
      meta.updateData(row.index, column.id, value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input value={value as string}
        onChange={(e) => setValue(e.target.value as TValue)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="h-8"/>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center">
      {String(value ?? '')}
    </div>
  );
}

// Editable cell that always shows input (spreadsheet style)
export function EditableCellAlwaysInput<TData, TValue>({
  getValue,
  row,
  column,
  table,
}: CellContext<TData, TValue>) {
  const initialValue = getValue();
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    const meta = table.options.meta as TableMeta;
    if (meta?.updateData) {
      meta.updateData(row.index, column.id, value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input value={value as string}
      onChange={(e) => setValue(e.target.value as TValue)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="h-8 border-0 focus-visible:ring-1"/>
  );
}

// Editable number cell with auto-calculation support
export function EditableNumberCell<TData, TValue>({
  getValue,
  row,
  column,
  table,
}: CellContext<TData, TValue>) {
  const initialValue = getValue();
  const [value, setValue] = React.useState(initialValue);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(value as string) || 0;
    const meta = table.options.meta as TableMeta;
    if (meta?.updateData) {
      meta.updateData(row.index, column.id, numValue);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input type="number"
        value={value as string}
        onChange={(e) => setValue(e.target.value as TValue)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        className="h-8"
        step="0.01"
        min="0"/>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center">
      {typeof value === 'number' ? value.toFixed(2) : String(value ?? '')}
    </div>
  );
}
