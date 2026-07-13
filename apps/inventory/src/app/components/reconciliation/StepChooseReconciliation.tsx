import * as React from 'react';

import { ClipboardList, Plus, Search } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';

import { useStockReconciliations } from '../../hooks/useStockReconciliations';
import type { StockReconciliation } from '../../types/stock.types';
import { formatDate } from '../../utility';

/* ------------------------------------------------------------------ */
/*  Card for a draft reconciliation                                    */
/* ------------------------------------------------------------------ */

interface ReconciliationCardProps {
  reconciliation: StockReconciliation;
  isSelected: boolean;
  onSelect: () => void;
}

function ReconciliationCard({ reconciliation, isSelected, onSelect }: ReconciliationCardProps) {
  return (
    <button type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border-2 p-4 transition-all hover:border-primary/50 hover:bg-accent',
        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}>
      <div className="flex items-start gap-3">
        <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}>
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{reconciliation.reconciliation_no}</p>
            <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 uppercase">
              draft
            </span>
          </div>
          {reconciliation.purpose && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{reconciliation.purpose}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Created {formatDate(reconciliation.created_at, 'DD-MMM-YY')}
            {reconciliation.items_count != null && ` · ${reconciliation.items_count} item(s)`}
          </p>
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
/*  "Create New" card                                                  */
/* ------------------------------------------------------------------ */

function CreateNewCard({ isSelected, onSelect }: { isSelected: boolean; onSelect: () => void }) {
  return (
    <button type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-lg border-2 border-dashed p-4 transition-all hover:border-primary/50 hover:bg-accent',
        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card',
      )}>
      <div className="flex items-center gap-3">
        <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}>
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">Create New Reconciliation</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Start a fresh reconciliation for this warehouse
          </p>
        </div>
        {isSelected && (
          <div className="ml-auto shrink-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
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

interface StepChooseReconciliationProps {
  warehouseId: string;
  warehouseName: string;
  selectedReconciliationId: string | null;
  onSelect: (id: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepChooseReconciliation({
  warehouseName,
  selectedReconciliationId,
  onSelect,
  onNext,
  onBack,
}: StepChooseReconciliationProps) {
  const [search, setSearch] = React.useState('');
  // "create-new" is a sentinel — null in the parent means "create new"
  const [choice, setChoice] = React.useState<string>(
    selectedReconciliationId ?? 'create-new',
  );

  const draftFilters = React.useMemo(() => ({ status: 'draft' }), []);

  const { data: reconciliations, loading, error } = useStockReconciliations({
    pageSize: 50,
    filters: draftFilters,
  });

  const filtered = React.useMemo(() => {
    if (!search) return reconciliations;
    const q = search.toLowerCase();
    return reconciliations.filter(
      (r) =>
        r.reconciliation_no.toLowerCase().includes(q) ||
        r.purpose?.toLowerCase().includes(q),
    );
  }, [reconciliations, search]);

  const handleSelect = (id: string) => {
    setChoice(id);
    onSelect(id === 'create-new' ? null : id);
  };

  const canProceed = choice === 'create-new' || choice.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Resume a draft reconciliation for{' '}
        <span className="font-medium text-foreground">{warehouseName}</span>, or start a new one.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search reconciliations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"/>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1" style={{ maxHeight: 'calc(80vh - 320px)' }}>
        {/* Always show "Create New" first */}
        <CreateNewCard isSelected={choice === 'create-new'}
          onSelect={() => handleSelect('create-new')} />

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center py-4">{error}</p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No draft reconciliations found
          </p>
        )}

        {!loading &&
          filtered.map((rec) => (
            <ReconciliationCard key={rec.id}
              reconciliation={rec}
              isSelected={choice === rec.id}
              onSelect={() => handleSelect(rec.id)} />
          ))}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}
