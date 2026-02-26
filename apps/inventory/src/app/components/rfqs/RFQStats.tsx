import { FileText, FilePlus, Send, FileCheck } from 'lucide-react';

import { StatCard } from '../shared';

interface RFQStatsProps {
  total: number;
  draft: number;
  sent: number;
  responded: number;
}

export function RFQStats({ total, draft, sent, responded }: RFQStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total RFQs"
        value={total}
        icon={FileText}
        iconBg="bg-slate-100 dark:bg-slate-800"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <StatCard
        title="Draft"
        value={draft}
        icon={FilePlus}
        iconBg="bg-amber-100 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Sent"
        value={sent}
        icon={Send}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Responded"
        value={responded}
        icon={FileCheck}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}
