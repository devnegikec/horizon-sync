import * as React from 'react';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useMyWarehouses } from '../../hooks/useMyWarehouses';

/** Minimal warehouse shape needed to render the options. */
export interface WarehouseOption {
  id: string;
  name: string;
  code?: string | null;
}

/**
 * Radix reserves the empty string for "clear the selection" and rejects it as an
 * item value, so the "all warehouses" / "none available" rows need sentinels.
 */
const ALL_VALUE = '__all_warehouses__';
const NONE_VALUE = '__no_warehouses__';

export interface WarehouseSelectProps {
  /** Selected warehouse id. `''` means "all"/none and shows the placeholder. */
  value: string;
  onChange: (warehouseId: string) => void;
  /**
   * Options to render. Pass the list the caller already holds to avoid a second
   * request; omit it and the component loads the user's assigned warehouses.
   */
  warehouses?: WarehouseOption[];
  /** Adds an "All warehouses" option that resolves back to `''`. */
  allowAll?: boolean;
  allLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Renders a label above the trigger, associated with it via htmlFor/id. */
  label?: string;
  /** Id for the trigger. Defaults to a generated one so `label` stays associated. */
  htmlId?: string;
  placeholder?: string;
  triggerClassName?: string;
  className?: string;
}

function formatWarehouseOption(warehouse: WarehouseOption): string {
  return warehouse.code ? `${warehouse.name} (${warehouse.code})` : warehouse.name;
}

/** Radix only falls back to the placeholder for `''`, so map the empty state. */
function toSelectValue(value: string, allowAll: boolean): string {
  return allowAll && !value ? ALL_VALUE : value;
}

function toWarehouseId(selectValue: string): string {
  return selectValue === ALL_VALUE ? '' : selectValue;
}

function triggerPlaceholder(loading: boolean, placeholder: string): string {
  return loading ? 'Loading...' : placeholder;
}

function WarehouseOptions({
  warehouses,
  allowAll,
  allLabel,
  loading,
}: {
  warehouses: WarehouseOption[];
  allowAll: boolean;
  allLabel: string;
  loading: boolean;
}) {
  const isEmpty = !loading && warehouses.length === 0;
  return (
    <>
      {allowAll && <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>}
      {isEmpty && (
        <SelectItem value={NONE_VALUE} disabled>
          No warehouses available
        </SelectItem>
      )}
      {warehouses.map((warehouse) => (
        <SelectItem key={warehouse.id} value={warehouse.id}>
          {formatWarehouseOption(warehouse)}
        </SelectItem>
      ))}
    </>
  );
}

function WarehouseSelectView({
  warehouses,
  value,
  onChange,
  allowAll = false,
  allLabel = 'All warehouses',
  loading = false,
  disabled = false,
  label,
  htmlId,
  placeholder = 'Select warehouse',
  triggerClassName,
  className,
}: Omit<WarehouseSelectProps, 'warehouses'> & { warehouses: WarehouseOption[] }) {
  const generatedId = React.useId();
  const triggerId = htmlId ?? generatedId;

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label htmlFor={triggerId}>{label}</Label>}
      <Select value={toSelectValue(value, allowAll)}
        onValueChange={(next) => onChange(toWarehouseId(next))}
        disabled={disabled || loading}>
        <SelectTrigger id={triggerId} className={triggerClassName}>
          <SelectValue placeholder={triggerPlaceholder(loading, placeholder)} />
        </SelectTrigger>
        <SelectContent>
          <WarehouseOptions warehouses={warehouses} allowAll={allowAll} allLabel={allLabel} loading={loading} />
        </SelectContent>
      </Select>
    </div>
  );
}

function ConnectedWarehouseSelect({ loading, ...props }: Omit<WarehouseSelectProps, 'warehouses'>) {
  const { warehouses, loading: assignedLoading } = useMyWarehouses();
  return <WarehouseSelectView {...props} warehouses={warehouses} loading={loading ?? assignedLoading} />;
}

/**
 * Shared warehouse picker for the WMS header, stock dialogs and filters.
 *
 * Presentational unless `warehouses` is omitted, in which case it loads the
 * current user's assigned warehouses itself.
 */
export function WarehouseSelect({ warehouses, ...props }: WarehouseSelectProps) {
  if (warehouses) return <WarehouseSelectView {...props} warehouses={warehouses} />;
  return <ConnectedWarehouseSelect {...props} />;
}
