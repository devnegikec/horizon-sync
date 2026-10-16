import { cn } from '@horizon-sync/ui/lib';

import type { ReturnLineCondition } from '../../../types/wms.types';

import { CONDITION_LABELS } from './returnNotes';

const CONDITION_STYLES: Record<ReturnLineCondition, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-white',
  good: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-white',
  damaged: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white',
  hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white',
  quarantine: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white',
};

/** The condition the dock captured for a returned unit. */
export function ReturnConditionBadge({ condition, className }: { condition: ReturnLineCondition; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', CONDITION_STYLES[condition], className)}>
      {CONDITION_LABELS[condition]}
    </span>
  );
}
