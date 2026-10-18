import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { ShortBalance } from '../../../types/wms.types';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { EMPTY, shortId } from './shortageShared';

export interface ShortageColumnsOptions {
  /** Opens the read-only shortage detail dialog (history + close-out). */
  onView: (balance: ShortBalance) => void;
}

/** Prefer the human-readable ASN number; fall back to a truncated id when it is missing. */
function AsnCell({ balance }: { balance: ShortBalance }) {
  return (
    <span className="font-mono text-xs" title={balance.asn_order_id}>
      {balance.asn_order_no || shortId(balance.asn_order_id)}
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

function ShortageViewCell({ balance, onView }: { balance: ShortBalance } & ShortageColumnsOptions) {
  const label = `View shortage details for ${balance.sku}`;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" aria-label={label} onClick={() => onView(balance)}>
        <Eye className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function createShortageColumns({ onView }: ShortageColumnsOptions): ColumnDef<ShortBalance>[] {
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
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
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
      header: () => <div className="text-right">View</div>,
      cell: ({ row }) => <ShortageViewCell balance={row.original} onView={onView} />,
      enableSorting: false,
    },
  ];
}
