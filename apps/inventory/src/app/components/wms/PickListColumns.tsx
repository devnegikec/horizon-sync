import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, PackageCheck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { PickList } from '../../types/wms.types';
import { formatDate } from '../../utility';

import { WMSStatusBadge } from './WMSStatusBadge';

/** Statuses for which a pick list can be packed into a packing slip. */
const PACKABLE_STATUSES = ['pick_complete', 'completed', 'ready_for_dispatch'];

export interface PickListColumnsOptions {
  onPack: (pickList: PickList) => void;
  onView: (pickList: PickList) => void;
  /** Resolve the display name for a row's assigned worker. */
  getWorkerLabel: (pickList: PickList) => string;
}

function PickListStatusCell({ pickList }: { pickList: PickList }) {
  return (
    <div className="flex items-center gap-1.5">
      <WMSStatusBadge status={pickList.status} />
      {pickList.is_aging && (
        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600">Aged</span>
      )}
    </div>
  );
}

function PickListPriorityCell({ pickList }: { pickList: PickList }) {
  const priorityClass = pickList.priority > 0 ? 'font-mono font-semibold text-foreground' : 'text-muted-foreground';

  return (
    <div className="text-right">
      <span className={priorityClass}>{pickList.priority > 0 ? `P${pickList.priority}` : '—'}</span>
    </div>
  );
}

function PickListActionsCell({ pickList, onPack, onView }: { pickList: PickList } & PickListColumnsOptions) {
  const canPack = PACKABLE_STATUSES.includes(pickList.status);

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canPack && (
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => onPack(pickList)}>
          <PackageCheck className="h-3.5 w-3.5" />
          Pack
        </Button>
      )}
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(pickList)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
    </div>
  );
}

export function createPickListColumns({ onPack, onView, getWorkerLabel }: PickListColumnsOptions): ColumnDef<PickList>[] {
  return [
    {
      accessorKey: 'pick_list_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pick List #" />,
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.pick_list_no}</span>,
    },
    {
      accessorKey: 'invoice_reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice Ref" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.invoice_reference ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <PickListStatusCell pickList={row.original} />,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" className="justify-end" />,
      cell: ({ row }) => <PickListPriorityCell pickList={row.original} />,
    },
    {
      id: 'qty',
      header: () => <div className="text-right">Qty</div>,
      cell: ({ row }) => <div className="text-right">{row.original.progress?.total_qty ?? '—'}</div>,
      enableSorting: false,
    },
    {
      id: 'worker',
      header: () => <span>Worker</span>,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{getWorkerLabel(row.original)}</span>,
      enableSorting: false,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at, 'DD-MMM-YY') : '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <PickListActionsCell pickList={row.original} onPack={onPack} onView={onView} getWorkerLabel={getWorkerLabel} />,
      enableSorting: false,
    },
  ];
}
