import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { ReturnReceiptNoteSummary } from '../../../types/wms.types';
import { formatDate } from '../../../utility';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { EMPTY } from './returnNotes';

export interface ReturnReceiptNoteColumnsOptions {
  onView: (note: ReturnReceiptNoteSummary) => void;
}

/** Counts stay quiet at zero: only damaged units and open exceptions are worth a chip. */
function CountChip({ value, tone }: { value: number; tone: 'danger' | 'warning' }) {
  if (value <= 0) return <span className="text-muted-foreground">{EMPTY}</span>;
  const styles = tone === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-white';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{value}</span>;
}

function NoteNumberCell({ note }: { note: ReturnReceiptNoteSummary }) {
  return <span className="font-mono font-medium">{note.note_no}</span>;
}

function RegistrationCell({ note }: { note: ReturnReceiptNoteSummary }) {
  if (!note.registration_no) return <span className="text-muted-foreground">{EMPTY}</span>;
  return <span className="font-mono text-sm text-blue-600">{note.registration_no}</span>;
}

/**
 * Expected numbers are never re-based, so the short (or excess) quantity is
 * always shown next to the two figures it comes from.
 */
function QuantitiesCell({ note }: { note: ReturnReceiptNoteSummary }) {
  const difference = note.expected_qty - note.received_qty;

  return (
    <div className="text-right">
      <span className="font-medium tabular-nums">{note.received_qty}</span>
      <span className="text-muted-foreground"> / {note.expected_qty}</span>
      {note.mismatch && (
        <p className="text-[11px] text-amber-600">
          {difference > 0 ? `${difference} short` : `${Math.abs(difference)} excess`}
        </p>
      )}
    </div>
  );
}

function QueueActionsCell({ note, onView }: { note: ReturnReceiptNoteSummary } & ReturnReceiptNoteColumnsOptions) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(note)}>
        <Eye className="h-3.5 w-3.5" />
        Review
      </Button>
    </div>
  );
}

export function createReturnReceiptNoteColumns({ onView }: ReturnReceiptNoteColumnsOptions): ColumnDef<ReturnReceiptNoteSummary>[] {
  return [
    {
      accessorKey: 'note_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Note #" />,
      cell: ({ row }) => <NoteNumberCell note={row.original} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'registration_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Registration" />,
      cell: ({ row }) => <RegistrationCell note={row.original} />,
    },
    {
      id: 'quantities',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received / Expected" className="justify-end" />,
      cell: ({ row }) => <QuantitiesCell note={row.original} />,
      enableSorting: false,
    },
    {
      accessorKey: 'damaged_qty',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Damaged" />,
      cell: ({ row }) => <CountChip value={row.original.damaged_qty} tone="danger" />,
    },
    {
      accessorKey: 'open_exceptions',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Exceptions" />,
      cell: ({ row }) => <CountChip value={row.original.open_exceptions} tone="warning" />,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.created_at ? formatDate(row.original.created_at, 'DD-MMM-YY') : EMPTY}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <QueueActionsCell note={row.original} onView={onView} />,
      enableSorting: false,
    },
  ];
}
