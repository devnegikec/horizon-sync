import { type ColumnDef } from '@tanstack/react-table';
import { Ban, Eye } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { ReturnRegistrationListItem } from '../../../types/wms.types';
import { formatDate } from '../../../utility';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { EMPTY } from './returnNotes';
import { canCancelRegistration } from './returnRegistrations';

export interface ReturnRegistrationColumnsOptions {
  onView: (registration: ReturnRegistrationListItem) => void;
  onCancel: (registration: ReturnRegistrationListItem) => void;
}

function RegistrationNumberCell({ registration }: { registration: ReturnRegistrationListItem }) {
  return <span className="font-mono font-medium">{registration.registration_no}</span>;
}

function PlainCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">{EMPTY}</span>;
  return <span className="text-sm">{value}</span>;
}

function ProgressCell({ registration }: { registration: ReturnRegistrationListItem }) {
  const remaining = registration.expected_qty - registration.received_qty;

  return (
    <div className="text-right">
      <span className="font-medium tabular-nums">{registration.received_qty}</span>
      <span className="text-muted-foreground"> / {registration.expected_qty}</span>
      {remaining > 0 && <p className="text-[11px] text-muted-foreground">{remaining} to receive</p>}
    </div>
  );
}

/** Cancelling is only possible before the dock scans the first unit (§3.1). */
function RegistrationActionsCell({ registration, onView, onCancel }: { registration: ReturnRegistrationListItem } & ReturnRegistrationColumnsOptions) {
  return (
    <div className="flex items-center justify-end gap-2">
      {canCancelRegistration(registration.status) && (
        <Button size="sm"
          variant="outline"
          className="h-7 gap-1 border-destructive/20 px-2 text-xs text-red-600 hover:!bg-red-600 hover:!text-white"
          onClick={() => onCancel(registration)}>
          <Ban className="h-3 w-3" />
          Cancel
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(registration)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
    </div>
  );
}

export function createReturnRegistrationColumns({ onView, onCancel }: ReturnRegistrationColumnsOptions): ColumnDef<ReturnRegistrationListItem>[] {
  return [
    {
      accessorKey: 'registration_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Registration #" />,
      cell: ({ row }) => <RegistrationNumberCell registration={row.original} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'invoice_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
      cell: ({ row }) => <span className="font-mono text-xs text-blue-600">{row.original.invoice_no ?? EMPTY}</span>,
    },
    {
      accessorKey: 'party_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dealer" />,
      cell: ({ row }) => <PlainCell value={row.original.party_name} />,
    },
    {
      accessorKey: 'warehouse_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
      cell: ({ row }) => <PlainCell value={row.original.warehouse_name} />,
    },
    {
      id: 'progress',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received / Expected" className="justify-end" />,
      cell: ({ row }) => <ProgressCell registration={row.original} />,
      enableSorting: false,
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
      cell: ({ row }) => <RegistrationActionsCell registration={row.original} onView={onView} onCancel={onCancel}/>,
      enableSorting: false,
    },
  ];
}
