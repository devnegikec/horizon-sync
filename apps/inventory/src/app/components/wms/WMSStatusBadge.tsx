import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { cn } from '@horizon-sync/ui/lib';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Receiving slip
  pending_review: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  pending_putaway: { label: 'Pending Put-Away', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  putaway_complete: { label: 'Put-Away Complete', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  // Pick list / put-away
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  // Gate
  open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  // Worker task
  assigned: { label: 'Assigned', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
  // Scan result
  unauthorized: { label: 'Unauthorized', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  // Session
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
};

const LOCATION_TYPE_MAP: Record<string, { label: string; className: string }> = {
  zone: { label: 'Zone', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' },
  aisle: { label: 'Aisle', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400' },
  bay: { label: 'Bay', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
  level: { label: 'Level', className: 'bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-400' },
  bin: { label: 'Bin', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' },
};

interface WMSStatusBadgeProps {
  status: string;
  className?: string;
}

export function WMSStatusBadge({ status, className }: WMSStatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}

export function LocationTypeBadge({ type, className }: { type: string; className?: string }) {
  const config = LOCATION_TYPE_MAP[type] ?? { label: type, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
