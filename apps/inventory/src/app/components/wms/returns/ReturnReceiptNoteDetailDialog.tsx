import * as React from 'react';

import { ShieldAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components';

import { useReturnReceiptNote } from '../../../hooks/useWMS';
import type {
  ReturnDispositionAction,
  ReturnReceiptNoteDetail,
  ReturnReceiptNoteGroup,
} from '../../../types/wms.types';
import { hasPermission } from '../../../utils/permissions';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { ApproveReturnNoteDialog } from './ApproveReturnNoteDialog';
import { RejectReturnNoteDialog } from './RejectReturnNoteDialog';
import { ReturnConditionBadge } from './ReturnConditionBadge';
import { ReturnDispositionDialog } from './ReturnDispositionDialog';
import {
  conditionSummary,
  dispositionLabel,
  EMPTY,
  returnNoteRows,
  unclassifiedLines,
  type ReturnNoteLine,
  type ReturnNoteRowMeta,
} from './returnNotes';

function readMeta(row: QRDetailRow): ReturnNoteRowMeta {
  return (row.meta ?? {}) as ReturnNoteRowMeta;
}

/* ---- Cells -------------------------------------------------------------- */

/** Parent rows summarise the group; child rows carry the condition the dock captured. */
function ConditionCell({ row }: { row: QRDetailRow }) {
  const { item, group } = readMeta(row);
  if (!item) return <span className="text-xs text-muted-foreground">{group ? conditionSummary(group) : EMPTY}</span>;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ReturnConditionBadge condition={item.condition}/>
      {item.destination && <span className="text-[11px] text-muted-foreground">{item.destination}</span>}
      {item.exception_id && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-700 dark:text-white"
          title={`Exception ${item.exception_id}`}>
          Exception
        </span>
      )}
    </div>
  );
}

/** Every distinct routing already recorded for a group. */
function distinctDispositions(group: ReturnReceiptNoteGroup): string[] {
  const labels = group.items
    .map((item) => item.disposition)
    .filter((action): action is ReturnDispositionAction => Boolean(action))
    .map((action) => dispositionLabel(action));
  return [...new Set(labels)];
}

function DispositionCell({ row }: { row: QRDetailRow }) {
  const { item, group } = readMeta(row);
  if (!item) {
    const labels = group ? distinctDispositions(group) : [];
    return <span className="text-xs text-muted-foreground">{labels.length > 0 ? labels.join(', ') : EMPTY}</span>;
  }
  if (item.disposition) return <span className="text-xs">{dispositionLabel(item.disposition)}</span>;
  if (item.condition === 'pending') return <span className="text-xs text-muted-foreground">Awaiting classification</span>;
  return <span className="text-xs text-amber-600">Not disposed</span>;
}

/**
 * Only classified lines of a note still pending approval can be decided, and only
 * by a caller holding `return.dispose`.
 */
function DisposeCell({ row, onDispose }: { row: QRDetailRow; onDispose: (line: ReturnNoteLine) => void }) {
  const { item, group, status } = readMeta(row);
  if (!item || !group || status !== 'pending_approval' || item.condition === 'pending') return null;

  return (
    <div className="flex justify-end">
      <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => onDispose({ item, group })}>
        <ShieldAlert className="h-3 w-3" />
        {item.disposition ? 'Change' : 'Disposition'}
      </Button>
    </div>
  );
}

/* ---- Summary / footer --------------------------------------------------- */

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

/** Expected vs received is always visible; a mismatch is explained, never hidden. */
function ReturnNoteSummary({ note }: { note: ReturnReceiptNoteDetail }) {
  const blocked = unclassifiedLines(note);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
        <StatCard label="Status" value={<WMSStatusBadge status={note.status}/>}/>
        <StatCard label="Expected" value={note.expected_qty}/>
        <StatCard label="Received" value={note.received_qty}/>
        <StatCard label="Short" value={note.short_qty}/>
        <StatCard label="Warehouse" value={note.warehouse?.name ?? EMPTY}/>
      </div>

      <p className="text-xs text-muted-foreground">
        Registration <span className="font-mono">{note.registration_no ?? EMPTY}</span>
      </p>

      {note.short_qty > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-700">
          Expected and received differ by {note.short_qty} unit(s). The expected quantity is never re-based — decide the
          note, or reject it.
        </div>
      )}

      {blocked.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {blocked.length} line(s) are still unclassified by the dock, so this note cannot be approved.
        </div>
      )}
    </div>
  );
}

function NoteFooter({
  note,
  canApprove,
  onApprove,
  onReject,
}: {
  note: ReturnReceiptNoteDetail;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (note.status !== 'pending_approval') return null;

  const blocked = unclassifiedLines(note);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {blocked.length > 0
          ? 'Classify every line before approving.'
          : 'Approving moves stock on every line and cannot be undone.'}
      </p>
      {canApprove && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-destructive/20 text-red-600 hover:!bg-red-600 hover:!text-white" onClick={onReject}>
            Reject
          </Button>
          <Button size="sm" disabled={blocked.length > 0} onClick={onApprove}>
            Approve note
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---- Dialog ------------------------------------------------------------- */

export interface ReturnReceiptNoteDetailDialogProps {
  noteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Supervisor review of one return receipt note: the dock's classification against
 * what was expected, the per-line disposition, and the approve/reject decision.
 * The returns API is not deployed yet, so the screens follow the documented
 * contract and surface 404s as ordinary errors.
 */
export function ReturnReceiptNoteDetailDialog({ noteId, open, onOpenChange }: ReturnReceiptNoteDetailDialogProps) {
  const { note, loading, error, approveNote, rejectNote, disposeLine } = useReturnReceiptNote(noteId);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canApprove = hasPermission(permissions, 'return.approve');
  const canDispose = hasPermission(permissions, 'return.dispose');

  const [lineTarget, setLineTarget] = React.useState<ReturnNoteLine | null>(null);
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);

  const rows = React.useMemo(() => returnNoteRows(note), [note]);

  const columns = React.useMemo<QRDetailColumn[]>(() => {
    const built: QRDetailColumn[] = [
      { id: 'condition', header: 'Condition', cell: (row) => <ConditionCell row={row}/> },
      { id: 'disposition', header: 'Disposition', cell: (row) => <DispositionCell row={row}/> },
    ];
    if (canDispose) {
      built.push({ id: 'actions', header: 'Actions', align: 'right', cell: (row) => <DisposeCell row={row} onDispose={setLineTarget}/> });
    }
    return built;
  }, [canDispose]);

  // Never leave a child dialog open over a different note.
  React.useEffect(() => {
    setLineTarget(null);
    setApproveOpen(false);
    setRejectOpen(false);
  }, [noteId, open]);

  const handleDispose = React.useCallback(
    async (action: ReturnDispositionAction, reasonCode?: string, lineNote?: string) => {
      if (!lineTarget) return;
      await disposeLine(lineTarget.item.id, action, reasonCode, lineNote);
    },
    [lineTarget, disposeLine],
  );

  const handleApprove = React.useCallback(
    async (approvalNote?: string) => {
      await approveNote(approvalNote ? { note: approvalNote } : {});
    },
    [approveNote],
  );

  return (
    <>
      <QRDetailDialog open={open}
        onOpenChange={onOpenChange}
        title={note ? `Return Receipt Note — ${note.note_no}` : 'Return Receipt Note'}
        loading={loading}
        loadingMessage="Loading return receipt note..."
        rows={rows}
        columns={columns}
        defaultExpanded
        emptyMessage="No received units on this note"
        subtitle={error ? <p className="text-sm text-destructive">{error}</p> : undefined}
        summary={note ? <ReturnNoteSummary note={note}/> : undefined}
        footer={note ? (
          <NoteFooter note={note}
            canApprove={canApprove}
            onApprove={() => setApproveOpen(true)}
            onReject={() => setRejectOpen(true)}/>
        ) : undefined}/>

      <ReturnDispositionDialog open={Boolean(lineTarget)}
        onOpenChange={(next) => {
          if (!next) setLineTarget(null);
        }}
        line={lineTarget}
        onConfirm={handleDispose}/>

      <ApproveReturnNoteDialog open={approveOpen} onOpenChange={setApproveOpen} note={note} onConfirm={handleApprove}/>

      <RejectReturnNoteDialog open={rejectOpen} onOpenChange={setRejectOpen} note={note} onConfirm={rejectNote}/>
    </>
  );
}
