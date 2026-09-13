import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Loader2, PackageCheck, Truck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { PackingSlipListItem } from '../../types/wms.types';
import { formatDate } from '../../utility';

import { WMSStatusBadge } from './WMSStatusBadge';

export interface PackingSlipColumnsOptions {
  /** Id of the row currently running an action, if any. */
  busyId: string | null;
  onView: (slip: PackingSlipListItem) => void;
  onMarkLoading: (slip: PackingSlipListItem) => void;
  onDispatch: (slip: PackingSlipListItem) => void;
}

function PackingSlipActionsCell({ slip, busyId, onView, onMarkLoading, onDispatch }: { slip: PackingSlipListItem } & PackingSlipColumnsOptions) {
  const busy = busyId === slip.id;

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(slip)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
      {slip.status === 'draft' && (
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={busy} onClick={() => onMarkLoading(slip)}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
          Mark Loading
        </Button>
      )}
      {slip.status === 'loading' && (
        <Button size="sm" className="h-7 gap-1 px-2 text-xs" disabled={busy} onClick={() => onDispatch(slip)}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
          Dispatch
        </Button>
      )}
    </div>
  );
}

export function createPackingSlipColumns({ busyId, onView, onMarkLoading, onDispatch }: PackingSlipColumnsOptions): ColumnDef<PackingSlipListItem>[] {
  return [
    {
      accessorKey: 'packing_slip_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Packing Slip #" />,
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.packing_slip_no}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'order_ids',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.order_ids.length}</span>,
    },
    {
      accessorKey: 'item_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{row.original.item_count}</div>,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at, 'DD-MMM-YY') : '\u2014'}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <PackingSlipActionsCell slip={row.original} busyId={busyId} onView={onView} onMarkLoading={onMarkLoading} onDispatch={onDispatch} />
      ),
      enableSorting: false,
    },
  ];
}
