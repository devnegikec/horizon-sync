import { CalendarDays, Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib';

import type { AnalyticsFilters as AnalyticsFiltersType, QSealBlockOption, QSealProductListItem } from '../../types/qseal.types';

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFiltersType>>;
  productOptions?: QSealProductListItem[];
  blockOptions?: QSealBlockOption[];
}

const PRESETS: { label: string; days: number }[] = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function startOfDay(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function endOfDay(value: string) {
  return new Date(`${value}T23:59:59.999`).toISOString();
}

export function AnalyticsFilters({ filters, setFilters, productOptions = [], blockOptions = [] }: AnalyticsFiltersProps) {
  const setDatePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    setFilters((prev) => ({ ...prev, date_from: from.toISOString(), date_to: to.toISOString() }));
  };

  const activePreset = (() => {
    if (!filters.date_from || !filters.date_to) return null;
    const diffDays = Math.round((new Date(filters.date_to).getTime() - new Date(filters.date_from).getTime()) / 86400000) + 1;
    return PRESETS.find((preset) => Math.abs(preset.days - diffDays) <= 1) ?? null;
  })();

  const hasAdvancedFilters = Boolean(filters.product_id || filters.batch || filters.serial_number || (filters.risk_filter && filters.risk_filter !== 'all'));
  const batchOptions = Array.from(new Set(blockOptions.map((block) => block.batch).filter(Boolean)));

  const clearFilters = () => {
    setFilters((prev) => ({ date_from: prev.date_from, date_to: prev.date_to }));
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-1">
          <CalendarDays className="mr-1 hidden h-4 w-4 text-muted-foreground md:block" />
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={activePreset?.label === preset.label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDatePreset(preset.days)}
              className={cn('h-8', activePreset?.label === preset.label && 'bg-primary text-primary-foreground')}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>From</span>
          <Input
            type="date"
            value={toDateInputValue(filters.date_from)}
            onChange={(event) => setFilters((prev) => ({ ...prev, date_from: event.target.value ? startOfDay(event.target.value) : undefined }))}
            className="h-8 w-[140px] text-xs"
          />
          <span>to</span>
          <Input
            type="date"
            value={toDateInputValue(filters.date_to)}
            onChange={(event) => setFilters((prev) => ({ ...prev, date_to: event.target.value ? endOfDay(event.target.value) : undefined }))}
            className="h-8 w-[140px] text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t pt-3 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span>QSeal filters</span>
        {hasAdvancedFilters && (
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Select value={filters.product_id || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, product_id: value === 'all' ? undefined : value }))}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {productOptions.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}{product.sku ? ` (${product.sku})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search serial number"
            value={filters.serial_number || ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, serial_number: event.target.value || undefined }))}
            className="h-9 pl-9"
          />
        </div>

        <Select value={filters.batch || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, batch: value === 'all' ? undefined : value }))}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batchOptions.map((batch) => <SelectItem key={batch} value={batch}>{batch}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.risk_filter || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, risk_filter: value === 'all' ? undefined : value as AnalyticsFiltersType['risk_filter'] }))}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All scan risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scan risk</SelectItem>
            <SelectItem value="suspicious">Suspicious scans</SelectItem>
            <SelectItem value="high_risk">High-risk scans</SelectItem>
            <SelectItem value="unreviewed">Unreviewed suspicious</SelectItem>
          </SelectContent>
        </Select>

      </div>
    </div>
  );
}
