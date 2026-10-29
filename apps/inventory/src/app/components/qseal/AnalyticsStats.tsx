import { ArrowDown, ArrowUp, BarChart3, CheckCircle2, Fingerprint, Minus, Repeat2, ShieldAlert } from 'lucide-react';

import type { AnalyticsFilters, QSealAnalyticsSummary } from '../../types/qseal.types';
import { StatCard } from '../shared';

interface AnalyticsStatsProps {
  summary: QSealAnalyticsSummary | null;
  previousSummary: QSealAnalyticsSummary | null;
  previousPeriod: Pick<AnalyticsFilters, 'date_from' | 'date_to'> | null;
}

type ComparisonDirection = 'positive' | 'negative' | 'neutral';
type ComparisonUnit = 'count' | 'percentage_points';

function Comparison({
  current,
  previous,
  direction,
  unit = 'count',
  previousPeriod,
}: {
  current: number | undefined;
  previous: number | undefined;
  direction: ComparisonDirection;
  unit?: ComparisonUnit;
  previousPeriod?: Pick<AnalyticsFilters, 'date_from' | 'date_to'> | null;
}) {
  const change = comparisonChange(current, previous, unit);
  if (!change) return null;
  const color = comparisonColor(change.delta, direction);
  const Icon = change.delta > 0 ? ArrowUp : change.delta < 0 ? ArrowDown : Minus;

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`} title={`Previous period (${formatPeriod(previousPeriod)}): ${change.previousLabel}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {change.changeLabel} <span className="font-normal">({change.absoluteLabel}) vs previous period</span>
    </span>
  );
}

function formatPeriod(period?: Pick<AnalyticsFilters, 'date_from' | 'date_to'> | null): string {
  if (!period?.date_from || !period.date_to) return 'unavailable';
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const from = new Date(period.date_from);
  const to = new Date(period.date_to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'unavailable';
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

function comparisonChange(current: number | undefined, previous: number | undefined, unit: ComparisonUnit) {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  const percentChange = previous === 0 ? null : (delta / previous) * 100;
  const absoluteLabel = formatAbsoluteDelta(delta, unit);
  const changeLabel = formatRelativeDelta(delta, percentChange);
  const previousLabel = unit === 'percentage_points' ? `${previous.toFixed(1)}%` : previous.toLocaleString();
  return { delta, absoluteLabel, changeLabel, previousLabel };
}

function signedPrefix(value: number): string {
  return value > 0 ? '+' : '';
}

function formatAbsoluteDelta(delta: number, unit: ComparisonUnit): string {
  if (unit === 'percentage_points') return `${signedPrefix(delta)}${delta.toFixed(1)}pp`;
  return `${signedPrefix(delta)}${Math.round(delta).toLocaleString()}`;
}

function formatRelativeDelta(delta: number, percentChange: number | null): string {
  if (percentChange == null) return delta === 0 ? 'No change' : 'New';
  return `${signedPrefix(percentChange)}${Math.round(percentChange)}%`;
}

function comparisonColor(delta: number, direction: ComparisonDirection): string {
  if (direction === 'neutral' || delta === 0) return 'text-muted-foreground';
  const isImprovement = direction === 'positive' ? delta > 0 : delta < 0;
  return isImprovement ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

export function AnalyticsStats({ summary, previousSummary, previousPeriod }: AnalyticsStatsProps) {
  const current: Partial<QSealAnalyticsSummary> = summary ?? {};
  const previous: Partial<QSealAnalyticsSummary> = previousSummary ?? {};
  const cards = [
    {
      title: 'Total Scans',
      value: formatCount(current.total_scans),
      icon: BarChart3,
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      comparison: <Comparison current={current.total_scans} previous={previous.total_scans} direction="positive" previousPeriod={previousPeriod} />,
    },
    {
      title: 'Valid Scans',
      value: formatCount(current.valid_scans),
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      comparison: <Comparison current={current.valid_scans} previous={previous.valid_scans} direction="positive" previousPeriod={previousPeriod} />,
    },
    {
      title: 'Unique Serials',
      value: formatCount(current.unique_serials),
      icon: Fingerprint,
      iconBg: 'bg-violet-100 dark:bg-violet-900/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      comparison: <Comparison current={current.unique_serials} previous={previous.unique_serials} direction="positive" previousPeriod={previousPeriod} />,
    },
    {
      title: 'Repeat Scan Rate',
      value: formatRate(current.repeat_scan_rate),
      icon: Repeat2,
      iconBg: 'bg-amber-100 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      comparison: <Comparison current={current.repeat_scan_rate} previous={previous.repeat_scan_rate} direction="neutral" unit="percentage_points" previousPeriod={previousPeriod} />,
    },
    {
      title: 'Suspicious Scans',
      value: formatCount(current.suspicious_scans),
      icon: ShieldAlert,
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      comparison: <Comparison current={current.suspicious_scans} previous={previous.suspicious_scans} direction="negative" previousPeriod={previousPeriod} />,
    },
  ];

  return (
    <div className="space-y-2">
      {previousPeriod && <p className="text-xs text-muted-foreground">Compared with {formatPeriod(previousPeriod)}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => <StatCard key={card.title} {...card} />)}
      </div>
    </div>
  );
}

function formatCount(value: number | undefined): string {
  return value == null ? '—' : value.toLocaleString();
}

function formatRate(value: number | undefined): string {
  return value == null ? '—' : `${value.toFixed(1)}%`;
}
