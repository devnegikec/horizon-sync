import { Package, Boxes, DollarSign, AlertTriangle } from 'lucide-react';

import { StatCard } from '../shared';

interface ItemStatsProps {
  totalItems: number;
  activeItems: number;
}

export function ItemStats({ totalItems, activeItems }: ItemStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Items"
        value={totalItems}
        icon={Package}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"/>
      <StatCard title="Active Items"
        value={activeItems}
        icon={Boxes}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"/>
      <StatCard title="Inventory Value"
        value="—"
        icon={DollarSign}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"/>
      <StatCard title="Low Stock Alerts"
        value="—"
        icon={AlertTriangle}
        iconBg="bg-amber-100 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"/>
    </div>
  );
}
