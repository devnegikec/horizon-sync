import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, MoreHorizontal, Trash2, Truck } from 'lucide-react';

import { Badge, Button } from '@horizon-sync/ui/components';
import { DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

import type { AsnOrder, AsnOrderStatus, AsnOrderVehicleArrivalInfo } from '../../types/asn-order.types';
import { formatDate } from '../../utility';

export interface AsnOrderColumnsOptions {
  onView?: (order: AsnOrder) => void;
  onEdit?: (order: AsnOrder) => void;
  onDelete?: (order: AsnOrder) => void;
  /** ID of the most recently created ASN order to highlight */
  recentlyCreatedId?: string | null;
}

export function getStatusBadge(status: AsnOrderStatus) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'confirmed':
      return { variant: 'success' as const, label: 'Confirmed' };
    case 'partially_delivered':
      return { variant: 'warning' as const, label: 'Partially Delivered' };
    case 'delivered':
      return { variant: 'success' as const, label: 'Delivered' };
    case 'closed':
      return { variant: 'outline' as const, label: 'Closed' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

export function getAsnTypeLabel(type?: string | null): string {
  switch (type) {
    case 'purchase':
      return 'Purchase';
    case 'internal_transfer':
      return 'Internal Transfer';
    case 'stock_receipt':
      return 'Stock Receipt';
    default:
      return type || '—';
  }
}

function AsnOrderNumberCell({ order, isNew }: { order: AsnOrder; isNew: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <code className="text-sm font-medium">{order.asn_order_no}</code>
      {isNew && (
        <Badge variant="success" className="px-1.5 py-0 text-[10px]">
          New
        </Badge>
      )}
    </div>
  );
}

/** Unique vehicle numbers across all arrivals of an order. */
function getVehicleNumbers(arrivals: AsnOrderVehicleArrivalInfo[]): string[] {
  return Array.from(
    new Set(arrivals.map((arrival) => arrival.vehicle_no).filter((vehicleNo): vehicleNo is string => Boolean(vehicleNo))),
  );
}

function ArrivalDetails({ arrival }: { arrival: AsnOrderVehicleArrivalInfo }) {
  const details = [arrival.driver_name, arrival.transporter, arrival.dock].filter(Boolean).join(' · ');
  return (
    <div className="text-xs">
      <p className="font-medium">{arrival.vehicle_no ?? 'Vehicle unavailable'}</p>
      <p className="text-muted-foreground">{details || 'No additional arrival details'}</p>
    </div>
  );
}

function AsnOrderVehicleCell({ arrivals }: { arrivals: AsnOrderVehicleArrivalInfo[] }) {
  const vehicleNumbers = getVehicleNumbers(arrivals);

  if (vehicleNumbers.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-help items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-sm">{vehicleNumbers[0]}</span>
            {vehicleNumbers.length > 1 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                +{vehicleNumbers.length - 1}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm space-y-2">
          {arrivals.map((arrival) => (
            <ArrivalDetails key={arrival.id} arrival={arrival} />
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AsnOrderActionsCell({
  order,
  onView,
  onEdit,
  onDelete,
}: { order: AsnOrder } & AsnOrderColumnsOptions) {
  const isDraft = order.status === 'draft';

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onView?.(order)}>
        <Eye className="h-3.5 w-3.5" />
        View
      </Button>
      {isDraft && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(order)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(order)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function createAsnOrderColumns({
  onView,
  onEdit,
  onDelete,
  recentlyCreatedId,
}: AsnOrderColumnsOptions): ColumnDef<AsnOrder, unknown>[] {
  return [
    {
      accessorKey: 'asn_order_no',
      header: ({ column }) => <DataTableColumnHeader column={column} title="ASN Order #" />,
      cell: ({ row }) => (
        <AsnOrderNumberCell order={row.original} isNew={!!recentlyCreatedId && row.original.id === recentlyCreatedId} />
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const statusBadge = getStatusBadge(row.original.status);
        return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
      },
    },
    {
      accessorKey: 'asn_type',
      header: () => <span>Type</span>,
      cell: ({ row }) => <Badge variant="outline">{getAsnTypeLabel(row.original.asn_type)}</Badge>,
      enableSorting: false,
    },
    {
      accessorKey: 'order_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.order_date, 'DD-MMM-YY')}</span>,
    },
    {
      accessorKey: 'to_warehouse',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Target Warehouse" />,
      cell: ({ row }) => {
        const warehouseName = row.original.to_warehouse?.name;
        return warehouseName ? <span className="text-sm">{warehouseName}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'vehicle_arrivals',
      header: () => <span>Vehicle</span>,
      cell: ({ row }) => <AsnOrderVehicleCell arrivals={row.original.vehicle_arrivals ?? []} />,
      enableSorting: false,
    },
    {
      accessorKey: 'grand_total',
      header: () => <div className="text-right">Grand Total</div>,
      cell: ({ row }) => {
        const grandTotal = row.original.grand_total;
        return grandTotal ? (
          <div className="text-right font-medium">{Number(grandTotal).toFixed(2)}</div>
        ) : (
          <div className="text-right text-muted-foreground">—</div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => <AsnOrderActionsCell order={row.original} onView={onView} onEdit={onEdit} onDelete={onDelete} />,
      enableSorting: false,
    },
  ];
}
