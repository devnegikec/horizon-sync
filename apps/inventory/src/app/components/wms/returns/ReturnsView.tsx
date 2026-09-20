import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent } from '@horizon-sync/ui/components';

import { hasPermission } from '../../../utils/permissions';

import { ReturnReceiptNoteQueue } from './ReturnReceiptNoteQueue';
import { ReturnRegistrationList } from './ReturnRegistrationList';

const RETURN_VIEWS = [
  { key: 'notes', label: 'Receipt Notes' },
  { key: 'registrations', label: 'Registrations' },
] as const;

type ReturnView = (typeof RETURN_VIEWS)[number]['key'];

export interface ReturnsViewProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

/**
 * The Returns section: the two halves of one flow. Registrations are what the
 * dealer is sending back; receipt notes are what the dock actually received and
 * the supervisor has to decide on. Both need `return.read`, and the actions
 * inside are gated further.
 */
export function ReturnsView({ warehouseId, refreshKey }: ReturnsViewProps) {
  const permissions = useUserStore((state) => state.permissions.permissions);
  const [view, setView] = React.useState<ReturnView>('notes');

  if (!hasPermission(permissions, 'return.read')) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-sm text-muted-foreground">You do not have access to returns.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 rounded-lg border bg-muted/20 p-1">
        {RETURN_VIEWS.map(({ key, label }) => (
          <button key={key}
            type="button"
            onClick={() => setView(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {view === 'notes' ? (
        <ReturnReceiptNoteQueue warehouseId={warehouseId} refreshKey={refreshKey}/>
      ) : (
        <ReturnRegistrationList warehouseId={warehouseId} refreshKey={refreshKey}/>
      )}
    </div>
  );
}
