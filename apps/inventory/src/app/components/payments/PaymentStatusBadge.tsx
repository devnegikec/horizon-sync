import { memo } from 'react';
import { Badge } from '@horizon-sync/ui/components';
import { getStatusColor } from '../../utils/payment.utils';
import type { PaymentStatus } from '../../types/payment.types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export const PaymentStatusBadge = memo(function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge className={getStatusColor(status)}>{status}</Badge>;
});
