import { CheckCircle2, Clock, PackageCheck, Truck } from 'lucide-react';

import type { AsnOrderStatusCounts } from '../../types/asn-order.types';
import { StatCard } from '../shared';


interface AsnStatsProps {
  counts: AsnOrderStatusCounts | null;
}

export function AsnStats({ counts }: AsnStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total ASN Orders"
        value={counts?.total ?? 0}
        icon={Truck}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"/>
      <StatCard title="Delivered"
        value={counts?.delivered ?? 0}
        icon={PackageCheck}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"/>
      <StatCard title="Partially Delivered"
        value={counts?.partially_delivered ?? 0}
        icon={Clock}
        iconBg="bg-violet-100 dark:bg-violet-900/20"
        iconColor="text-violet-600 dark:text-violet-400"/>
      <StatCard title="Confirmed"
        value={counts?.confirmed ?? 0}
        icon={CheckCircle2}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"/>
    </div>
  );
}
