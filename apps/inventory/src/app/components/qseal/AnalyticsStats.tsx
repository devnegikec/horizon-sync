import { BarChart3, Globe, MousePointerClick, Smartphone } from 'lucide-react';

import type { AnalyticsSummary, AnalyticsInteractionFunnel } from '../../types/qseal.types';
import { StatCard } from '../shared';


interface AnalyticsStatsProps {
  summary: AnalyticsSummary | null;
  interactionFunnel: AnalyticsInteractionFunnel | null;
}

export function AnalyticsStats({ summary, interactionFunnel }: AnalyticsStatsProps) {
  const totalScans = summary ? summary.total_scans.toLocaleString() : '—';
  const uniqueSerials = summary ? summary.unique_serials.toLocaleString() : '—';

  const devices = summary?.by_device ?? [];
  const totalDevice = devices.reduce((s, d) => s + d.count, 0);
  const mobileCount = devices.find((d) => d.device_type === 'mobile')?.count ?? 0;
  const mobilePct = totalDevice > 0 ? `${Math.round((mobileCount / totalDevice) * 100)}%` : '—';

  const convRate = interactionFunnel?.conversion_rate;
  const conversionPct = convRate != null ? `${Math.round(convRate * 100)}%` : '—';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Scans" value={totalScans} icon={BarChart3} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
      <StatCard title="Unique Products" value={uniqueSerials} icon={Globe} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
      <StatCard title="Mobile Scans" value={mobilePct} icon={Smartphone} iconBg="bg-violet-100 dark:bg-violet-900/20" iconColor="text-violet-600 dark:text-violet-400" />
      <StatCard title="Conversion Rate" value={conversionPct} icon={MousePointerClick} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
    </div>
  );
}
