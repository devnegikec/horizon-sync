import { Badge } from '@horizon-sync/ui/components';

import type { PickListStatus } from '../../types/pick-list.types';

interface PickListStatusBadgeProps {
  status: PickListStatus;
}

const statusConfig: Record<PickListStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
  },
  completed: {
    label: 'Completed',
    variant: 'outline',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
  },
};

export function PickListStatusBadge({ status }: PickListStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
