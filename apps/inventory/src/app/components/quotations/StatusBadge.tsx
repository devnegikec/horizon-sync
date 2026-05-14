import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components';

import type { QuotationStatus } from '../../types/quotation.types';

interface StatusBadgeProps {
  status: QuotationStatus | string;
  className?: string;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'warning' },
  sent: { label: 'Sent', variant: 'default' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  partially_delivered: { label: 'Partially Delivered', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'success' },
  closed: { label: 'Closed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  // Invoice statuses
  submitted: { label: 'Submitted', variant: 'default' },
  paid: { label: 'Paid', variant: 'success' },
  partially_paid: { label: 'Partially Paid', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  // Payment statuses
  reconciled: { label: 'Reconciled', variant: 'success' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const safeStatus = typeof status === 'string' ? status : '';
  const config = statusConfig[safeStatus?.toLowerCase?.() || ''] || {
    label: safeStatus,
    variant: 'secondary' as BadgeVariant,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
