import { memo } from 'react';
import { formatCurrency } from '../../utils/payment.utils';

interface PaymentAmountDisplayProps {
  /** Amount (API may return as string) */
  amount: number | string;
  currencyCode: string;
  className?: string;
}

export const PaymentAmountDisplay = memo(function PaymentAmountDisplay({ amount, currencyCode, className }: PaymentAmountDisplayProps) {
  return <div className={className}>{formatCurrency(amount, currencyCode)}</div>;
});
