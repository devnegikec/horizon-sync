import * as React from 'react';

import { Building2, Calendar, Search } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';

import { useWarehouses } from '../../hooks/useWarehouses';
import type { Warehouse } from '../../types/warehouse.types';
import { formatDate } from '../../utility';

/* ------------------------------------------------------------------ */
/*  Warehouse card                                                     */
/* ------------------------------------------------------------------ */

interface WarehouseCardProps {
  warehouse: Warehouse;
  isSelected: boolean;
  onSelect: () => void;
}

function WarehouseCard({ warehouse, isSelected, onSelect }: WarehouseCardProps) {
  const location = [warehouse.city, warehouse.state, warehouse.country]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border-2 p-4 transition-all hover:border-primary/50 hover:bg-accent',
        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{warehouse.name}</p>
            <span className="shrink-0 text-xs text-muted-foreground font-mono">
              {warehouse.code}
            </span>
          </div>
          {location && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{location}</p>
          )}
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Last reconciled:{' '}
              {warehouse.updated_at ? formatDate(warehouse.updated_at, 'DD-MMM-YY') : 'Never'}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="shrink-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Step component                                                     */
/* ------------------------------------------------------------------ */

interface StepSelectWarehouseProps {
  selectedWarehouseId: string;
  onSelect: (id: string, name: string) => void;
  onNext: () => void;
}

export function StepSelectWarehouse({
  selectedWarehouseId,
  onSelect,
  onNext,
}: StepSelectWarehouseProps) {
  const [search, setSearch] = React.useState('');
  const { warehouses, loading, error } = useWarehouses(1, 50, { search });

  const filtered = React.useMemo(() => {
    if (!search) return warehouses;
    const q = search.toLowerCase();
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.code.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q),
    );
  }, [warehouses, search]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the warehouse you want to reconcile. The system will generate a template with
        current stock counts.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search warehouses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No warehouses found
          </p>
        )}

        {!loading &&
          filtered.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              isSelected={selectedWarehouseId === warehouse.id}
              onSelect={() => onSelect(warehouse.id, warehouse.name)}
            />
          ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!selectedWarehouseId}>
          Next
        </Button>
      </div>
    </div>
  );
}
