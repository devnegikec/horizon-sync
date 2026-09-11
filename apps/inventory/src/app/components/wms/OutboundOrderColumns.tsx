import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, ClipboardList, Eye, Loader2, PackageCheck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

import type { OutboundOrderListItem } from '../../types/wms.types';
import { formatDate } from '../../utility';

import { WMSStatusBadge } from './WMSStatusBadge';

export interface OutboundOrderColumnsOptions {
  /** Id of the order currently running the Confirm action, if any. */
  confirmingId: string | null;
  /** Id of the order currently running the Pack action, if any. */
  packingId: string | null;
  /** True while an order detail request is in flight. */
  viewLoading: boolean;
  onConfirm: (order: OutboundOrderListItem) => void;
  onPack: (order: OutboundOrderListItem) => void;
  onCreatePickList: (order: OutboundOrderListItem) => void;
  onView: (order: OutboundOrderListItem) => void;
}

function OrderTypeCell({ order }: { order: OutboundOrderListItem }) {
  return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase">{order.order_type}</span>;
}

function OrderStockCell({ order }: { order: OutboundOrderListItem }) {
  const outOfStock = order.out_of_stock_count;

  return (
    <span className="text-xs">
      <span className="text-green-600">{order.in_stock_count} in</span>
      <span className="text-muted-foreground"> / </span>
      <span className={outOfStock > 0 ? 'text-red-600' : 'text-muted-foreground'}>{outOfStock} out</span>
    </span>
  );
}

function OrderActionsCell({
  order,
  confirmingId,
  packingId,
  viewLoading,
  onConfirm,
  onPack,
  onCreatePickList,
  onView,
}: { order: OutboundOrderListItem } & OutboundOrderColumnsOptions) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {order.status === 'draft' && (
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={confirmingId === order.id} onClick={() => onConfirm(order)}>
          {confirmingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Confirm
        </Button>
      )}
      {order.status === 'confirmed' && (
        <Button size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onCreatePickList(order)}>
          <ClipboardList className="h-3.5 w-3.5" />
          Create Pick List
        </Button>
      )}
      {order.status === 'completed' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={packingId === order.id} onClick={() => onPack(order)}>
                {packingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                Pack
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a packing slip from this completed order&apos;s picked items.</p>
              <p className="text-muted-foreground">Then Mark Loading → Dispatch from the Packing Slips tab.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" disabled={viewLoading} onClick={() => onView(order)}>
        {viewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
        View
      </Button>
    </div>
  );
}

export function createOutboundOrderColumns({
  confirmingId,
  packingId,
  viewLoading,
  onConfirm,
  onPack,
  onCreatePickList,
  onView,
}: OutboundOrderColumnsOptions): ColumnDef<OutboundOrderListItem>[] {
  return [
    {
      accessorKey: 'order_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order #" />,
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.order_no}</span>,
    },
    {
      accessorKey: 'order_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <OrderTypeCell order={row.original} />,
    },
    {
      accessorKey: 'invoice_reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice Ref" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.invoice_reference ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      id: 'stock',
      header: () => <span>Stock</span>,
      cell: ({ row }) => <OrderStockCell order={row.original} />,
      enableSorting: false,
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
        <span className="text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at, 'DD-MMM-YY') : '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <OrderActionsCell order={row.original}
          confirmingId={confirmingId}
          packingId={packingId}
          viewLoading={viewLoading}
          onConfirm={onConfirm}
          onPack={onPack}
          onCreatePickList={onCreatePickList}
          onView={onView}/>
      ),
      enableSorting: false,
    },
  ];
}
