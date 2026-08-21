import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { cn } from '@horizon-sync/ui/lib';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Receiving slip
  pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white' },
  pending_putaway: { label: 'Pending Put-Away', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white' },
  putaway_complete: { label: 'Put-Away Complete', className: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white' },
  // Pick list / put-away
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white' },
  // Gate
  open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white' },
  // Worker task
  assigned: { label: 'Assigned', className: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white' },
  // Scan result
  unauthorized: { label: 'Unauthorized', className: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white' },
  // Session
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white' },
};

const LOCATION_TYPE_MAP: Record<string, { label: string; className: string }> = {
  zone: { label: 'Zone', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-white' },
  aisle: { label: 'Aisle', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-white' },
  bay: { label: 'Bay', className: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-white' },
  level: { label: 'Level', className: 'bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-white' },
  bin: { label: 'Bin', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-white' },
};

interface WMSStatusBadgeProps {
  status: string;
  className?: string;
}

export function WMSStatusBadge({ status, className }: WMSStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}

export function LocationTypeBadge({ type, className }: { type: string; className?: string }) {
  const config = LOCATION_TYPE_MAP[type] ?? { label: type, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
