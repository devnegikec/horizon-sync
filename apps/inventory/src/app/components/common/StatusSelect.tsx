import * as React from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

interface StatusSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  availableStatuses: T[];
  statusLabels?: Record<T, string>;
  disabled?: boolean;
}

function getDefaultLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function StatusSelect<T extends string>({
  value,
  onValueChange,
  availableStatuses,
  statusLabels,
  disabled = false,
}: StatusSelectProps<T>) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || availableStatuses.length === 1}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableStatuses.filter(Boolean).map((status) => (
          <SelectItem key={status} value={status}>
            {statusLabels?.[status] || getDefaultLabel(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
