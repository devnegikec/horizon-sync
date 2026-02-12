import * as React from 'react';
import { Badge } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import type { QuotationStatus } from '../../types/quotation.types';

interface StatusBadgeProps {
  status: QuotationStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  partially_delivered: {
    label: 'Partially Delivered',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
