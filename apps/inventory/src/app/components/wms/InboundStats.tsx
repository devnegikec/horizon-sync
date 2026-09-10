import * as React from 'react';

import { CheckCircle2, ClipboardList, Clock, Loader, PackageCheck } from 'lucide-react';

import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { cn } from '@horizon-sync/ui/lib';

import { usePutAwayLists, useReceivingSlips } from '../../hooks/useWMS';
import type { PutAwayStatusCounts, ReceivingSlipStatusCounts } from '../../types/wms.types';
import { formatQuantity } from '../../utility';

type InboundStatsSection = 'receiving' | 'putaway' | 'vehicle' | 'exceptions';

interface InboundStatsProps {
  warehouseId?: string;
  /**
   * Active inbound sub-tab. Stats switch for 'receiving' and 'putaway';
   * any other tab (vehicle/exceptions) keeps showing the previous stats.
   */
  activeSection: InboundStatsSection;
  /** Called when a receiving-slip status card is clicked, with the status to filter by ('all' clears the filter). */
  onSelectReceivingStatus: (status: string) => void;
  /** Called when a put-away status card is clicked, with the status to filter by ('all' clears the filter). */
  onSelectPutAwayStatus: (status: string) => void;
}

interface StatDef {
  key: string;
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

const RECEIVING_STATS: StatDef[] = [
  { key: 'total', title: 'Total Receiving Slips', filter: 'all', icon: ClipboardList },
  { key: 'pending_review', title: 'Pending Review', filter: 'pending_review', icon: Clock },
  { key: 'pending_putaway', title: 'Pending Put-Away', filter: 'pending_putaway', icon: PackageCheck },
  { key: 'putaway_in_progress', title: 'Put-Away In Progress', filter: 'putaway_in_progress', icon: Loader },
];

const PUTAWAY_STATS: StatDef[] = [
  { key: 'total', title: 'Total Put-Away Lists', filter: 'all', icon: ClipboardList },
  { key: 'pending', title: 'Pending', filter: 'pending', icon: Clock },
  { key: 'in_progress', title: 'In Progress', filter: 'in_progress', icon: Loader },
  { key: 'completed', title: 'Completed', filter: 'completed', icon: CheckCircle2 },
];

const STAT_SECTIONS = ['receiving', 'putaway'] as const;
type StatsSection = (typeof STAT_SECTIONS)[number];

const STATS_BY_SECTION: Record<StatsSection, StatDef[]> = {
  receiving: RECEIVING_STATS,
  putaway: PUTAWAY_STATS,
};

function StatCard({
  stat,
  counts,
  colorIndex,
  onSelect,
}: {
  stat: StatDef;
  counts: Record<string, number> | null;
  colorIndex: number;
  onSelect: (filter: string) => void;
}) {
  const Icon = stat.icon;
  const colors = STAT_COLORS[colorIndex] || STAT_COLORS[0];

  return (
    <button type="button"
      className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      onClick={() => onSelect(stat.filter)}
      title={`View ${stat.title.toLowerCase()}`}>
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

export function InboundStats({
  warehouseId,
  activeSection,
  onSelectReceivingStatus,
  onSelectPutAwayStatus,
}: InboundStatsProps) {
  // Remember the last stats section so vehicle/exceptions keep showing the
  // previous stats rather than clearing.
  const [statsSection, setStatsSection] = React.useState<StatsSection>('receiving');

  React.useEffect(() => {
    if (STAT_SECTIONS.includes(activeSection as StatsSection)) {
      setStatsSection(activeSection as StatsSection);
    }
  }, [activeSection]);

  const receiving = useReceivingSlips({
    warehouse_id: warehouseId,
    page: 1,
    page_size: 1,
  });

  const putaway = usePutAwayLists({
    warehouse_id: warehouseId,
    page: 1,
    page_size: 1,
  });

  const stats = STATS_BY_SECTION[statsSection];
  const counts: ReceivingSlipStatusCounts | PutAwayStatusCounts | null =
    statsSection === 'putaway' ? putaway.statusCounts : receiving.statusCounts;
  const onSelect = statsSection === 'putaway' ? onSelectPutAwayStatus : onSelectReceivingStatus;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.key}
          stat={stat}
          counts={counts as Record<string, number> | null}
          colorIndex={i}
          onSelect={onSelect} />
      ))}
    </div>
  );
}
