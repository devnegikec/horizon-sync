import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { OutboundOrderStatusCounts } from '../../../types/wms.types';

const STATUS_FILTERS: { value: string; label: string; countKey: keyof OutboundOrderStatusCounts }[] = [
  { value: 'all', label: 'All Statuses', countKey: 'total' },
  { value: 'draft', label: 'Draft', countKey: 'draft' },
  { value: 'confirmed', label: 'Confirmed', countKey: 'confirmed' },
  { value: 'pending_picking', label: 'Pending Picking', countKey: 'pending_picking' },
  { value: 'completed', label: 'Completed', countKey: 'completed' },
  { value: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
];

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'sap', label: 'SAP' },
  { value: 'asn', label: 'ASN' },
];

export interface OutboundOrderFiltersProps {
  statusFilter: string;
  typeFilter: string;
  /** Counts published by the list; `null` renders each status as 0. */
  statusCounts: OutboundOrderStatusCounts | null;
  onStatusFilterChange: (status: string) => void;
  onTypeFilterChange: (type: string) => void;
}

export function OutboundOrderFilters({
  statusFilter,
  typeFilter,
  statusCounts,
  onStatusFilterChange,
  onTypeFilterChange,
}: OutboundOrderFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label} ({statusCounts?.[filter.countKey] ?? 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
