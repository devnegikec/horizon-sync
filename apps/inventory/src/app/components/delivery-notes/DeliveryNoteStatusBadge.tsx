import { Badge } from '@horizon-sync/ui/components';

import type { DeliveryNoteStatus } from '../../types/delivery-note.types';

interface DeliveryNoteStatusBadgeProps {
  status: DeliveryNoteStatus;
}

const statusConfig: Record<DeliveryNoteStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export function DeliveryNoteStatusBadge({ status }: DeliveryNoteStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
