import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Ban, CheckCircle2, ClipboardList, Eye, Loader2, PackageCheck, TriangleAlert } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';
import { cn } from '@horizon-sync/ui/lib';

import type { OutboundOrderListItem } from '../../../types/wms.types';
import { formatDate } from '../../../utility';
import { WMSStatusBadge } from '../WMSStatusBadge';

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

// ─── Stock readiness → confirmation state ─────────────────────────────────────

/**
 * How much of a draft order can be fulfilled right now. Zero items is treated as
 * blocked: there is nothing to reserve, so confirming would be meaningless.
 */
export type OrderFulfilment = 'ready' | 'partial' | 'blocked';

export function orderFulfilment(order: OutboundOrderListItem): OrderFulfilment {
  if (order.item_count === 0 || order.in_stock_count === 0) return 'blocked';
  if (order.in_stock_count < order.item_count) return 'partial';
  return 'ready';
}

/** Amber is the caution tone used elsewhere in WMS for "proceed with care". */
const PARTIAL_CONFIRM_CLASS =
  'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950';

interface ConfirmSpec {
  label: string;
  variant: 'default' | 'outline';
  className: string;
  tooltip: React.ReactNode;
}

/** Label, weight and hover explanation for each fulfilment state. */
function confirmSpec(order: OutboundOrderListItem): ConfirmSpec {
  const { in_stock_count: inStock, item_count: items } = order;
  const fulfilment = orderFulfilment(order);
  const plural = items === 1 ? '' : 's';

  if (fulfilment === 'blocked') {
    return {
      label: "Can't Confirm",
      variant: 'outline',
      className: '',
      tooltip: (
        <>
          <p>Order can&apos;t be confirmed — none of the {items} item{plural} are in stock.</p>
          <p className="text-muted-foreground">Receive stock for this warehouse, then confirm.</p>
        </>
      ),
    };
  }

  if (fulfilment === 'partial') {
    return {
      label: 'Partial Delivery',
      variant: 'outline',
      className: PARTIAL_CONFIRM_CLASS,
      tooltip: (
        <>
          <p>Only {inStock} of {items} items are in stock.</p>
          <p className="text-muted-foreground">Confirming raises a partial delivery for the available lines.</p>
        </>
      ),
    };
  }

  return {
    label: 'Confirm',
    variant: 'default',
    className: '',
    tooltip: <p>All {items} items are in stock — ready to confirm.</p>,
  };
}

function confirmIcon(fulfilment: OrderFulfilment) {
  if (fulfilment === 'blocked') return <Ban className="h-3.5 w-3.5" />;
  if (fulfilment === 'partial') return <TriangleAlert className="h-3.5 w-3.5" />;
  return <CheckCircle2 className="h-3.5 w-3.5" />;
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

/**
 * Confirm is a draft order's next action, so it carries the row's primary weight
 * — except when stock is short, where it drops to a caution action and, with
 * nothing in stock, is disabled with the reason available on hover.
 */
function ConfirmButton({
  order,
  confirmingId,
  onConfirm,
}: {
  order: OutboundOrderListItem;
  confirmingId: string | null;
  onConfirm: (order: OutboundOrderListItem) => void;
}) {
  const fulfilment = orderFulfilment(order);
  const isConfirming = confirmingId === order.id;
  const spec = confirmSpec(order);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* The span keeps the tooltip reachable while the button is disabled. */}
          <span className="inline-flex">
            <Button size="sm"
              variant={spec.variant}
              className={cn('h-7 gap-1 px-2 text-xs', spec.className)}
              disabled={fulfilment === 'blocked' || isConfirming}
              onClick={() => onConfirm(order)}>
              {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : confirmIcon(fulfilment)}
              {spec.label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{spec.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
        <ConfirmButton order={order} confirmingId={confirmingId} onConfirm={onConfirm} />
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
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <WMSStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'invoice_reference',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
      cell: ({ row }) =>
        row.original.invoice_reference ? (
          <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{row.original.invoice_reference}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'order_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => <OrderTypeCell order={row.original} />,
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
