import { Layers } from 'lucide-react';

import { StatCard } from '../shared';

interface ItemGroupStatsProps {
  total: number;
  active: number;
}

export function ItemGroupStats({ total, active }: ItemGroupStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Groups"
        value={total}
        icon={Layers}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Active Groups"
        value={active}
        icon={Layers}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}
