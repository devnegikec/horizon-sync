import { CalendarDays } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import type { AnalyticsFilters as AnalyticsFiltersType } from '../../types/qseal.types';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFiltersType>>;
}

const PRESETS: { label: string; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

export function AnalyticsFilters({ filters, setFilters }: AnalyticsFiltersProps) {
  const setDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 86400000);
    setFilters((prev) => ({
      ...prev,
      date_from: from.toISOString(),
      date_to: to.toISOString(),
    }));
  };

  // Determine which preset is active (approx)
  const activePreset = (() => {
    if (!filters.date_from || !filters.date_to) return null;
    const diffMs = new Date(filters.date_to).getTime() - new Date(filters.date_from).getTime();
    const diffDays = Math.round(diffMs / 86400000);
    return PRESETS.find((p) => Math.abs(p.days - diffDays) <= 1) ?? null;
  })();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center rounded-lg border bg-card p-4">
      <CalendarDays className="h-4 w-4 text-muted-foreground hidden md:block" />

      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <Button key={p.label} variant={activePreset?.label === p.label ? 'default' : 'outline'} size="sm" onClick={() => setDatePreset(p.days)} className={cn('h-8', activePreset?.label === p.label && 'bg-primary text-primary-foreground')}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="date" value={filters.date_from ? filters.date_from.slice(0, 10) : ''} onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="border rounded px-2 py-1 text-xs bg-background" />
        <span>to</span>
        <input type="date" value={filters.date_to ? filters.date_to.slice(0, 10) : ''} onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="border rounded px-2 py-1 text-xs bg-background" />
      </div>
    </div>
  );
}
