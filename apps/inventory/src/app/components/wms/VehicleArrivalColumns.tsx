import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Link2, Pencil } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { VehicleArrivalListItem } from '../../types/wms.types';
import { formatDate } from '../../utility';

import { WMSStatusBadge } from './WMSStatusBadge';

export interface VehicleArrivalColumnsOptions {
  onEdit: (arrival: VehicleArrivalListItem) => void;
  onLinkAsn: (arrival: VehicleArrivalListItem) => void;
}

const DASH = '\u2014';

function VehicleNoCell({ arrival }: { arrival: VehicleArrivalListItem }) {
  return <span className="font-mono font-medium">{arrival.vehicle_no ?? DASH}</span>;
}

function TextCell({ value }: { value: string | null }) {
  return <span>{value ?? DASH}</span>;
}

function CountCell({ value }: { value: number }) {
  return <div className="text-right">{value}</div>;
}

function ArrivedAtCell({ arrival }: { arrival: VehicleArrivalListItem }) {
  return <span className="text-sm">{formatDate(arrival.arrived_at, 'DD-MMM-YY', { includeTime: true, timeFormat: 'HH:mm' })}</span>;
}

function ActionsCell({ arrival, onEdit, onLinkAsn }: { arrival: VehicleArrivalListItem } & VehicleArrivalColumnsOptions) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm"
variant="ghost"
className="h-7 gap-1 px-2 text-xs"
onClick={() => onEdit(arrival)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      <Button size="sm"
variant="ghost"
className="h-7 gap-1 px-2 text-xs"
onClick={() => onLinkAsn(arrival)}>
        <Link2 className="h-3.5 w-3.5" />
        Link ASN
      </Button>
    </div>
  );
}

export function createVehicleArrivalColumns({ onEdit, onLinkAsn }: VehicleArrivalColumnsOptions): ColumnDef<VehicleArrivalListItem>[] {
  return [
    {
      accessorKey: 'vehicle_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vehicle #" />,
      cell: ({ row }) => <VehicleNoCell arrival={row.original} />,
    },
    {
      accessorKey: 'driver_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Driver" />,
      cell: ({ row }) => <TextCell value={row.original.driver_name} />,
    },
    {
      accessorKey: 'dock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dock" />,
      cell: ({ row }) => <TextCell value={row.original.dock} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'asn_order_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ASNs" className="justify-end" />,
      cell: ({ row }) => <CountCell value={row.original.asn_order_count} />,
    },
    {
      accessorKey: 'receiving_slip_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slips" className="justify-end" />,
      cell: ({ row }) => <CountCell value={row.original.receiving_slip_count} />,
    },
    {
      accessorKey: 'arrived_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Arrived At" />,
      cell: ({ row }) => <ArrivedAtCell arrival={row.original} />,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => <ActionsCell arrival={row.original} onEdit={onEdit} onLinkAsn={onLinkAsn} />,
      enableSorting: false,
    },
  ];
}
