import * as React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle,
  DollarSign,
} from 'lucide-react';

import { StatCard } from '../shared';

interface PaymentStatsProps {
  total: number;
  pending: number;
  completed: number;
  totalAmount: number;
}

export const PaymentStats = React.memo(function PaymentStats({
  total,
  pending,
  completed,
  totalAmount,
}: PaymentStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      <StatCard
        title="Total Payments"
        value={total}
        icon={Wallet}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Pending"
        value={pending}
        icon={Clock}
        iconBg="bg-amber-100 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Completed"
        value={completed}
        icon={CheckCircle}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Total Amount"
        value={`${totalAmount.toLocaleString()}`}
        icon={DollarSign}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
    </div>
  );
});
