import * as React from 'react';

import { ChevronsUpDown, X } from 'lucide-react';

import { Checkbox, Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';

import type { WMSWorker } from '../../types/wms.types';

/** Display name for a worker, falling back to the employee id and then the row id. */
export function workerLabel(worker: WMSWorker): string {
  const full = `${worker.first_name} ${worker.last_name}`.trim();
  const name = worker.display_name ?? (full.length > 0 ? full : null);
  if (!name) return worker.employee_id ?? worker.id;
  return worker.employee_id ? `${name} (${worker.employee_id})` : name;
}

/**
 * Multi-select for assigning workers to a generated put-away or pick list.
 * Shared by the receiving-slip, outbound and returns generators, so the control
 * only has to be maintained once.
 */
export function WorkerMultiSelect({
  workers,
  selected,
  onChange,
  emptyLabel = 'No worker (unassigned)',
}: {
  workers: WMSWorker[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Wording for the "assign nobody" option. */
  emptyLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  // Namespaced ids: two generators can be mounted at once in the same tree.
  const idPrefix = React.useId();
  const selectedWorkers = workers.filter((worker) => selected.includes(worker.id));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2">
      {selectedWorkers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedWorkers.map((worker) => (
            <span key={worker.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {workerLabel(worker)}
              <button type="button"
                onClick={() => onChange(selected.filter((current) => current !== worker.id))}
                aria-label={`Remove ${workerLabel(worker)}`}
                className="rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button"
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <span className={selectedWorkers.length === 0 ? 'truncate text-muted-foreground' : 'truncate'}>
              {selectedWorkers.length === 0
                ? emptyLabel
                : `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-1" align="start">
          {/* Cap the list height so long worker lists scroll instead of overflowing the dialog. */}
          <div className="max-h-[240px] overflow-y-auto">
            <label htmlFor={`${idPrefix}-none`}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
              <Checkbox id={`${idPrefix}-none`} checked={selected.length === 0} onCheckedChange={() => onChange([])} className="mr-2" />
              {emptyLabel}
            </label>
            {workers.map((worker) => (
              <label key={worker.id}
                htmlFor={`${idPrefix}-${worker.id}`}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                <Checkbox id={`${idPrefix}-${worker.id}`}
                  checked={selected.includes(worker.id)}
                  onCheckedChange={() => toggle(worker.id)}
                  className="mr-2"/>
                {workerLabel(worker)}
              </label>
            ))}
          </div>
          <div className="mt-1 border-t border-border pt-1">
            <Button size="sm" variant="default" className="w-full justify-center" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
