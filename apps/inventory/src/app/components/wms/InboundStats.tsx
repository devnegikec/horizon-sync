import * as React from 'react';

import { CheckCircle2, ClipboardList, Clock, Loader, PackageCheck, XCircle } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { cn } from '@horizon-sync/ui/lib';

import { useReceivingSlips } from '../../hooks/useWMS';
import type { ReceivingSlipStatusCounts } from '../../types/wms.types';
import { formatQuantity } from '../../utility';

interface InboundStatsProps {
  warehouseId?: string;
  /** Called when a status card is clicked, with the status to filter receiving slips by ('all' clears the filter). */
  onSelectStatus: (status: string) => void;
}

interface StatDef {
  key: keyof ReceivingSlipStatusCounts;
  title: string;
  filter: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAT_COLORS = [
  { bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400' },
  { bg: 'bg-yellow-100 dark:bg-yellow-900/20', fg: 'text-yellow-600 dark:text-yellow-400' },
  { bg: 'bg-blue-100 dark:bg-blue-900/20', fg: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-violet-100 dark:bg-violet-900/20', fg: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/20', fg: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-red-100 dark:bg-red-900/20', fg: 'text-red-600 dark:text-red-400' },
] as const;

const STATS: StatDef[] = [
  { key: 'total', title: 'Total Receiving Slips', filter: 'all', icon: ClipboardList },
  { key: 'pending_review', title: 'Pending Review', filter: 'pending_review', icon: Clock },
  { key: 'pending_putaway', title: 'Pending Put-Away', filter: 'pending_putaway', icon: PackageCheck },
  { key: 'putaway_in_progress', title: 'Put-Away In Progress', filter: 'putaway_in_progress', icon: Loader },
];

function StatCard({
  stat,
  counts,
  colorIndex,
  onSelect,
}: {
  stat: StatDef;
  counts: ReceivingSlipStatusCounts | null;
  colorIndex: number;
  onSelect: (filter: string) => void;
}) {
  const Icon = stat.icon;
  const colors = STAT_COLORS[colorIndex] || STAT_COLORS[0];

  return (
    <button type="button"
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      onClick={() => onSelect(stat.filter)}
      title={`View ${stat.title.toLowerCase()} slips`}>
      <Card className="border-border hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold tracking-tight">{formatQuantity(counts?.[stat.key] ?? 0)}</p>
            </div>
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colors.bg)}>
              <Icon className={cn('h-6 w-6', colors.fg)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function InboundStats({ warehouseId, onSelectStatus }: InboundStatsProps) {
  const { statusCounts } = useReceivingSlips({
    warehouse_id: warehouseId,
    page: 1,
    page_size: 1,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <StatCard key={stat.key} stat={stat} counts={statusCounts} colorIndex={i} onSelect={onSelectStatus} />
      ))}
    </div>
  );
}
