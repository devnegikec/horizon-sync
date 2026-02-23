import { Badge } from '@horizon-sync/ui/components';

import type { InvoiceStatus } from '../../types/invoice.types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
  },
  pending: {
    label: 'Pending',
    variant: 'default',
  },
  paid: {
    label: 'Paid',
    variant: 'outline',
  },
  partial: {
    label: 'Partially Paid',
    variant: 'default',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
