import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, PackageX } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

import type { BulkDispositionAction } from '../../../types/wms.types';
import { formatDate } from '../../../utility';
import { isResolvedStatus } from '../exceptionGroups';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { DISPOSITION_ACTIONS } from './DispositionDialog';
import { EMPTY, exceptionIdentity, isMissingSerial, reasonCodeLabel, rowExceptions, type ExceptionTableRow } from './exceptionRows';

export interface InboundExceptionColumnsOptions {
  /** Without the dispose permission the row menu is hidden entirely. */
  canDispose: boolean;
  onDispose: (row: ExceptionTableRow, action: BulkDispositionAction) => void;
  /** Routes a `MISSING_SERIAL` exception (a shortage, not a move) to the shortage ledger. */
  onShortClose?: (row: ExceptionTableRow) => void;
}

/* ---- Cells ------------------------------------------------------------- */

function ItemCell({ row }: { row: ExceptionTableRow }) {
  const [first] = rowExceptions(row);
  if (!first) return null;

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="truncate font-medium">{exceptionIdentity(first)}</p>
      <p className="font-mono text-xs text-muted-foreground">
        {first.sku ?? EMPTY}
        {first.batch_number ? ` · Batch ${first.batch_number}` : ''}
      </p>
      {row.kind === 'group' && (
        <p className="text-xs text-muted-foreground">{row.exceptions.length} units share this SKU and batch</p>
      )}
    </div>
  );
}

function SerialCell({ row }: { row: ExceptionTableRow }) {
  if (row.kind === 'group') return <span className="text-xs text-muted-foreground">{EMPTY}</span>;
  const serial = row.exception.serial_number ?? row.exception.qr_identifier;
  if (!serial) return <span className="text-muted-foreground">{EMPTY}</span>;
  return <span className="font-mono text-xs">{serial}</span>;
}

function ReasonCell({ row }: { row: ExceptionTableRow }) {
  if (row.kind === 'group') return <span className="text-xs text-muted-foreground">{row.reasons}</span>;

  const { reason_code, condition_code, note, evidence } = row.exception;
  return (
    <div className="max-w-[220px] space-y-0.5">
      <p className="text-xs font-medium">{reasonCodeLabel(reason_code)}</p>
      {condition_code && <p className="text-xs text-muted-foreground">{condition_code}</p>}
      {note && <p className="truncate text-xs text-muted-foreground">{note}</p>}
      {evidence.length > 0 && <p className="text-xs text-muted-foreground">{evidence.length} evidence file(s)</p>}
    </div>
  );
}

function QuantityCell({ row }: { row: ExceptionTableRow }) {
  const value = row.kind === 'group' ? row.quantity : row.exception.quantity;
  return <div className="text-right font-medium tabular-nums">{value}</div>;
}

function DestinationCell({ row }: { row: ExceptionTableRow }) {
  if (row.kind === 'group') return <span className="text-xs">{row.destinations}</span>;
  return <span className="text-xs">{row.exception.destination ?? EMPTY}</span>;
}

function StatusCell({ row }: { row: ExceptionTableRow }) {
  if (row.kind === 'group') {
    return row.status ? <WMSStatusBadge status={row.status} /> : <span className="text-xs text-muted-foreground">Mixed</span>;
  }
  return <WMSStatusBadge status={row.exception.status} />;
}

function CreatedCell({ row }: { row: ExceptionTableRow }) {
  // Rows are sorted newest first, so a group's first unit carries the latest date.
  const [first] = rowExceptions(row);
  if (!first?.created_at) return <span className="text-muted-foreground">{EMPTY}</span>;
  return <span className="text-sm">{formatDate(first.created_at, 'DD-MMM-YY')}</span>;
}

/* ---- Actions ----------------------------------------------------------- */

function ExceptionActionsCell({
  row,
  onDispose,
  onShortClose,
}: { row: ExceptionTableRow } & Pick<InboundExceptionColumnsOptions, 'onDispose' | 'onShortClose'>) {
  const exceptions = rowExceptions(row);
  const resolved = exceptions.every((exception) => isResolvedStatus(exception.status));
  if (resolved) return <div className="text-right text-xs text-muted-foreground">Resolved</div>;

  const [first] = exceptions;
  const shortCloseOnly = exceptions.length > 0 && exceptions.every(isMissingSerial);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${first ? exceptionIdentity(first) : 'exception'}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {row.kind === 'group' ? `All ${row.exceptions.length} units` : 'This unit'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {shortCloseOnly ? (
            <DropdownMenuItem onClick={() => onShortClose?.(row)}>
              <PackageX className="mr-2 h-4 w-4" />
              Short-close (shortage ledger)
            </DropdownMenuItem>
          ) : (
            DISPOSITION_ACTIONS.map(({ value, label, icon: Icon, destructive }) => (
              <DropdownMenuItem key={value}
                className={destructive ? 'text-destructive focus:text-destructive' : undefined}
                onClick={() => onDispose(row, value)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function createInboundExceptionColumns({ canDispose, onDispose, onShortClose }: InboundExceptionColumnsOptions): ColumnDef<ExceptionTableRow>[] {
  const columns: ColumnDef<ExceptionTableRow>[] = [
    {
      id: 'item',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
      cell: ({ row }) => <ItemCell row={row.original} />,
    },
    {
      id: 'serial',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Serial #" />,
      cell: ({ row }) => <SerialCell row={row.original} />,
    },
    {
      id: 'reason',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reason" />,
      cell: ({ row }) => <ReasonCell row={row.original} />,
    },
    {
      id: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" className="justify-end" />,
      cell: ({ row }) => <QuantityCell row={row.original} />,
    },
    {
      id: 'destination',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Destination" />,
      cell: ({ row }) => <DestinationCell row={row.original} />,
    },
    {
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusCell row={row.original} />,
    },
    {
      id: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <CreatedCell row={row.original} />,
    },
  ];

  if (canDispose) {
    columns.push({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <ExceptionActionsCell row={row.original} onDispose={onDispose} onShortClose={onShortClose} />,
      enableSorting: false,
    });
  }

  return columns;
}
