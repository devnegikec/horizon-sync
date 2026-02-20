import { ShoppingCart, CheckCircle, DollarSign, Truck } from 'lucide-react';

import { StatCard } from '../shared';

interface SalesOrderStatsProps {
  total: number;
  confirmed: number;
  confirmedValue: number;
  pendingDelivery: number;
  currency?: string;
}

export function SalesOrderStats({ total, confirmed, confirmedValue, pendingDelivery, currency = 'INR' }: SalesOrderStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Orders"
        value={total}
        icon={ShoppingCart}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Confirmed"
        value={confirmed}
        icon={CheckCircle}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Confirmed Value"
        value={`${currency} ${confirmedValue.toFixed(2)}`}
        icon={DollarSign}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Pending Delivery"
        value={pendingDelivery}
        icon={Truck}
        iconBg="bg-purple-100 dark:bg-purple-900/20"
        iconColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
