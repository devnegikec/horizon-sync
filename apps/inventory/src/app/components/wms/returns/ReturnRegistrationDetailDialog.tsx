import * as React from 'react';

import { Ban } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components';

import { useReturnRegistration } from '../../../hooks/useWMS';
import type { ReturnRegistrationDetail, ReturnRegistrationLine } from '../../../types/wms.types';
import { formatDate } from '../../../utility';
import { hasPermission } from '../../../utils/permissions';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { EMPTY } from './returnNotes';
import { canCancelRegistration } from './returnRegistrations';

/** Fixed columns carry the expected quantity; these add what actually arrived. */
function ReceivedCell({ row }: { row: QRDetailRow }) {
  const line = (row.meta ?? {}).line as ReturnRegistrationLine | undefined;
  if (!line) return null;
  return <span className="text-right text-sm tabular-nums">{line.received_qty}</span>;
}

function ConditionsCell({ row }: { row: QRDetailRow }) {
  const line = (row.meta ?? {}).line as ReturnRegistrationLine | undefined;
  const conditions = line?.conditions;
  if (!conditions) return <span className="text-xs text-muted-foreground">{EMPTY}</span>;

  const parts = (['good', 'damaged', 'hold', 'quarantine'] as const)
    .filter((condition) => conditions[condition] > 0)
    .map((condition) => `${conditions[condition]} ${condition}`);

  return <span className="text-xs text-muted-foreground">{parts.length > 0 ? parts.join(' \u00b7 ') : EMPTY}</span>;
}

function SerialsCell({ row }: { row: QRDetailRow }) {
  const line = (row.meta ?? {}).line as ReturnRegistrationLine | undefined;
  if (!line?.serials?.length) return <span className="text-xs text-muted-foreground">{EMPTY}</span>;
  return <span className="font-mono text-[11px]">{line.serials.join(', ')}</span>;
}

function registrationRows(registration: ReturnRegistrationDetail | null): QRDetailRow[] {
  return (registration?.lines ?? []).map((line) => ({
    id: line.id,
    name: line.item_name ?? line.sku,
    sku: line.sku,
    serialNumber: null,
    quantity: line.expected_qty,
    meta: { line },
  }));
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SessionsList({ registration }: { registration: ReturnRegistrationDetail }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
      <p className="font-medium">Dock sessions</p>
      {registration.sessions.length === 0 ? (
        <p className="text-muted-foreground">None yet — the handheld has not started receiving.</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-muted-foreground">
          {registration.sessions.map((session) => (
            <li key={session.id}>
              {session.status} · {session.worker_name ?? session.worker_id ?? EMPTY} ·{' '}
              {session.started_at ? formatDate(session.started_at, 'DD-MMM-YY') : EMPTY}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RegistrationSummary({ registration }: { registration: ReturnRegistrationDetail }) {
  const remaining = registration.expected_qty - registration.received_qty;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <StatCard label="Status" value={<WMSStatusBadge status={registration.status}/>}/>
        <StatCard label="Expected" value={registration.expected_qty}/>
        <StatCard label="Received" value={registration.received_qty}/>
        <StatCard label="Dealer" value={registration.party?.name ?? EMPTY}/>
        <StatCard label="Warehouse" value={registration.warehouse?.name ?? EMPTY}/>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Invoice <span className="font-mono">{registration.invoice_no ?? EMPTY}</span>
        </span>
        <span>Reason {registration.return_reason_code ?? EMPTY}</span>
        {registration.return_date && <span>Return date {formatDate(registration.return_date, 'DD-MMM-YY')}</span>}
      </div>

      {registration.note && <p className="text-xs text-muted-foreground">{registration.note}</p>}

      {remaining > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
          {remaining} unit(s) still expected. The dock receives and classifies the units; until then this registration stays
          open.
        </div>
      )}

      <SessionsList registration={registration}/>
    </div>
  );
}

export interface ReturnRegistrationDetailDialogProps {
  registrationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (registration: ReturnRegistrationDetail) => void;
}

/** Expected vs received per line, with the classification the dock captured (§5.3). */
export function ReturnRegistrationDetailDialog({ registrationId, open, onOpenChange, onCancel }: ReturnRegistrationDetailDialogProps) {
  const { registration, loading, error } = useReturnRegistration(registrationId);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canRegister = hasPermission(permissions, 'return.register');

  const rows = React.useMemo(() => registrationRows(registration), [registration]);

  const columns = React.useMemo<QRDetailColumn[]>(() => [
    { id: 'received', header: 'Received', align: 'right', cell: (row) => <ReceivedCell row={row}/> },
    { id: 'conditions', header: 'Conditions', cell: (row) => <ConditionsCell row={row}/> },
    { id: 'serials', header: 'Serials', cell: (row) => <SerialsCell row={row}/> },
  ], []);

  const cancellable = registration ? canCancelRegistration(registration.status) : false;

  return (
    <QRDetailDialog open={open}
      onOpenChange={onOpenChange}
      title={registration ? `Return Registration — ${registration.registration_no}` : 'Return Registration'}
      loading={loading}
      loadingMessage="Loading return registration..."
      rows={rows}
      columns={columns}
      emptyMessage="No lines on this registration"
      subtitle={error ? <p className="text-sm text-destructive">{error}</p> : undefined}
      summary={registration ? <RegistrationSummary registration={registration}/> : undefined}
      footer={registration && canRegister && cancellable ? (
        <Button variant="outline" size="sm" className="border-destructive/20 text-red-600 hover:!bg-red-600 hover:!text-white" onClick={() => onCancel(registration)}>
          <Ban className="mr-1 h-3.5 w-3.5" />
          Cancel registration
        </Button>
      ) : undefined}/>
  );
}
