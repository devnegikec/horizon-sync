import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, PackageOpen } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { ReceivingSlip } from '../../../types/wms.types';
import { WMSStatusBadge } from '../WMSStatusBadge';

export interface ReceivingSlipColumnsOptions {
  onView: (slip: ReceivingSlip) => void;
  onApprove: (slip: ReceivingSlip) => void;
  onReject: (slip: ReceivingSlip) => void;
  onPutAway: (slip: ReceivingSlip) => void;
}

function formatCreatedAt(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '\u2014';
}

function SlipNumberCell({ slip }: { slip: ReceivingSlip }) {
  return <span className="font-mono font-medium">{slip.slip_number}</span>;
}

function AsnCell({ slip }: { slip: ReceivingSlip }) {
  if (!slip.asn_order_no) {
    return <span className="text-muted-foreground">{'\u2014'}</span>;
  }
  return <span className="font-mono text-sm text-blue-600">{slip.asn_order_no}</span>;
}

function ReceivingSlipActionsCell({
  slip,
  onView,
  onApprove,
  onReject,
  onPutAway,
}: { slip: ReceivingSlip } & ReceivingSlipColumnsOptions) {
  const isPendingReview = slip.status === 'pending_review';
  const isPendingPutAway = slip.status === 'pending_putaway';

  return (
    <div className="flex items-center justify-end gap-2">
      {isPendingReview && (
        <>
          <Button size="sm"
            variant="outline"
            className="h-7 border-green-200 px-2 text-xs text-green-600 hover:!bg-green-600 hover:!text-white"
            onClick={() => onApprove(slip)}>
            Approve
          </Button>
          <Button size="sm"
            variant="outline"
            className="h-7 border-destructive/20 px-2 text-xs text-destructive hover:!bg-destructive hover:!text-white"
            onClick={() => onReject(slip)}>
            Reject
          </Button>
        </>
      )}
      <Button size="sm"
        variant="ghost"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => onView(slip)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
      {isPendingPutAway && (
        <Button size="sm"
          variant="outline"
          className="h-7 border-blue-200 px-2 text-xs text-blue-600 hover:bg-blue-50"
          onClick={() => onPutAway(slip)}>
          <PackageOpen className="mr-1 h-3.5 w-3.5" />
          Put-Away
        </Button>
      )}
    </div>
  );
}

export function createReceivingSlipColumns({
  onView,
  onApprove,
  onReject,
  onPutAway,
}: ReceivingSlipColumnsOptions): ColumnDef<ReceivingSlip>[] {
  return [
    {
      accessorKey: 'slip_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slip #" />,
      cell: ({ row }) => <SlipNumberCell slip={row.original} />,
    },
    {
      accessorKey: 'asn_order_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ASN" />,
      cell: ({ row }) => <AsnCell slip={row.original} />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'total_boxes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Boxes" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{row.original.total_boxes}</div>,
    },
    {
      accessorKey: 'total_items',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" className="justify-end" />,
      cell: ({ row }) => <div className="text-right">{row.original.total_items}</div>,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <span className="text-muted-foreground">{formatCreatedAt(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ReceivingSlipActionsCell slip={row.original}
          onView={onView}
          onApprove={onApprove}
          onReject={onReject}
          onPutAway={onPutAway} />
      ),
      enableSorting: false,
    },
  ];
}
