import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { PutAwayList } from '../../types/wms.types';
import { formatDate } from '../../utility';

import { WMSStatusBadge } from './WMSStatusBadge';

export interface PutAwayColumnsOptions {
  onView: (list: PutAwayList) => void;
}

function ListNumberCell({ list }: { list: PutAwayList }) {
  return <span className="font-mono font-medium">{list.put_away_list_no}</span>;
}

function ReceivingSlipCell({ list }: { list: PutAwayList }) {
  if (!list.receiving_slip_no) {
    return <span className="text-muted-foreground">{'\u2014'}</span>;
  }
  return <span className="font-mono text-xs text-blue-600">{list.receiving_slip_no}</span>;
}

function ItemsCell({ list }: { list: PutAwayList }) {
  return (
    <div className="text-right">
      <span className="font-medium">{list.completed_items}</span>
      <span className="text-muted-foreground"> / {list.total_items}</span>
    </div>
  );
}

function WorkerCell({ list }: { list: PutAwayList }) {
  return <span className="text-xs text-muted-foreground">{list.worker_name ?? list.assigned_to ?? '\u2014'}</span>;
}

function PutAwayActionsCell({ list, onView }: { list: PutAwayList } & PutAwayColumnsOptions) {
  return (
    <div className="flex items-center justify-end">
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => onView(list)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
    </div>
  );
}

export function createPutAwayColumns({ onView }: PutAwayColumnsOptions): ColumnDef<PutAwayList>[] {
  return [
    {
      accessorKey: 'put_away_list_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="List #" />,
      cell: ({ row }) => <ListNumberCell list={row.original} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'receiving_slip_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Receiving Slip" />,
      cell: ({ row }) => <ReceivingSlipCell list={row.original} />,
    },
    {
      accessorKey: 'total_items',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-end" />,
      cell: ({ row }) => <ItemsCell list={row.original} />,
    },
    {
      accessorKey: 'worker_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Worker" />,
      cell: ({ row }) => <WorkerCell list={row.original} />,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.created_at, 'DD-MMM-YY')}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <PutAwayActionsCell list={row.original} onView={onView} />,
      enableSorting: false,
    },
  ];
}
