import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { ShortBalance } from '../../../types/wms.types';

import { EMPTY, shortId, StatusPill } from './shortageShared';

export interface ShortageColumnsOptions {
  /** Closing a shortage needs `inbound_exception.dispose`. */
  canClose: boolean;
  onHistory: (balance: ShortBalance) => void;
  onClose: (balance: ShortBalance) => void;
}

/** Server ids are UUIDs; the first block is enough to correlate rows in the UI. */
function AsnCell({ balance }: { balance: ShortBalance }) {
  return (
    <span className="font-mono text-xs" title={balance.asn_order_id}>
      {shortId(balance.asn_order_id)}
    </span>
  );
}

function SkuCell({ balance }: { balance: ShortBalance }) {
  return <span className="font-mono text-xs font-medium">{balance.sku}</span>;
}

function NumberCell({ value, className }: { value: number; className?: string }) {
  return <div className={`text-right tabular-nums ${className ?? ''}`}>{value}</div>;
}

function CodeCell({ value }: { value: string | null }) {
  return <span className="text-xs text-muted-foreground">{value ?? EMPTY}</span>;
}

/** Only a residual quantity can be written off; a zero short is just closed. */
function closeLabel(balance: ShortBalance): string {
  return balance.short_qty > 0 ? 'Write off…' : 'Close…';
}

function ShortageActionsCell({
  balance,
  canClose,
  onHistory,
  onClose,
}: { balance: ShortBalance } & ShortageColumnsOptions) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onHistory(balance)}>
        History
      </Button>
      {canClose && balance.status === 'open' && (
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onClose(balance)}>
          {closeLabel(balance)}
        </Button>
      )}
    </div>
  );
}

export function createShortageColumns({ canClose, onHistory, onClose }: ShortageColumnsOptions): ColumnDef<ShortBalance>[] {
  return [
    {
      accessorKey: 'asn_order_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ASN" />,
      cell: ({ row }) => <AsnCell balance={row.original} />,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      cell: ({ row }) => <SkuCell balance={row.original} />,
    },
    {
      accessorKey: 'expected_qty',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expected" className="justify-end" />,
      cell: ({ row }) => <NumberCell value={row.original.expected_qty} />,
    },
    {
      accessorKey: 'received_qty',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Received" className="justify-end" />,
      cell: ({ row }) => <NumberCell value={row.original.received_qty} />,
    },
    {
      accessorKey: 'short_qty',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Short" className="justify-end" />,
      cell: ({ row }) => <NumberCell value={row.original.short_qty} className="font-medium text-amber-600" />,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
      accessorKey: 'reason_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Dock Reason" />,
      cell: ({ row }) => <CodeCell value={row.original.reason_code} />,
    },
    {
      accessorKey: 'close_reason_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Closure Reason" />,
      cell: ({ row }) => <CodeCell value={row.original.close_reason_code} />,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ShortageActionsCell balance={row.original}
          canClose={canClose}
          onHistory={onHistory}
          onClose={onClose}/>
      ),
      enableSorting: false,
    },
  ];
}
