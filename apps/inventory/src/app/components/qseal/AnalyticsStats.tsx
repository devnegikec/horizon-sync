import { AlertTriangle, BarChart3, CheckCircle2, Repeat2, ShieldAlert } from 'lucide-react';

import type { QSealAnalyticsSummary } from '../../types/qseal.types';
import { StatCard } from '../shared';

interface AnalyticsStatsProps {
  summary: QSealAnalyticsSummary | null;
}

export function AnalyticsStats({ summary }: AnalyticsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Scans"
        value={summary?.total_scans.toLocaleString() ?? '—'}
        icon={BarChart3}
        iconBg="bg-blue-100 dark:bg-blue-900/20"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Valid Scans"
        value={summary?.valid_scans.toLocaleString() ?? '—'}
        icon={CheckCircle2}
        iconBg="bg-emerald-100 dark:bg-emerald-900/20"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Unique Serials"
        value={summary?.unique_serials.toLocaleString() ?? '—'}
        icon={AlertTriangle}
        iconBg="bg-violet-100 dark:bg-violet-900/20"
        iconColor="text-violet-600 dark:text-violet-400"
      />
      <StatCard
        title="Repeat Scan Rate"
        value={summary ? `${Math.round(summary.repeat_scan_rate)}%` : '—'}
        icon={Repeat2}
        iconBg="bg-amber-100 dark:bg-amber-900/20"
        iconColor="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Suspicious Scans"
        value={summary?.suspicious_scans.toLocaleString() ?? '—'}
        icon={ShieldAlert}
        iconBg="bg-red-100 dark:bg-red-900/20"
        iconColor="text-red-600 dark:text-red-400"
      />
    </div>
  );
}
