import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, MoreHorizontal, Eye, Edit, Trash2, Loader2, Truck } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

import type { AsnOrder, AsnOrderStatus } from '../../types/asn-order.types';
import { formatDate } from '../../utility';

function getStatusBadge(status: AsnOrderStatus) {
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

export interface AsnOrdersTableProps {
  asnOrders: AsnOrder[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (order: AsnOrder) => void;
  onEdit?: (order: AsnOrder) => void;
  onDelete?: (order: AsnOrder) => void;
  onCreateOrder?: () => void;
  onTableReady?: (table: Table<AsnOrder>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
  /** ID of the most recently created ASN order to highlight */
  recentlyCreatedId?: string | null;
}

export function AsnOrdersTable({
  asnOrders,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateOrder,
  onTableReady,
  serverPagination,
  recentlyCreatedId,
}: AsnOrdersTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<AsnOrder> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;

    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.pageIndex + 1,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<AsnOrder, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'asn_order_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ASN Order #" />,
        cell: ({ row }) => {
          const orderNo = row.original.asn_order_no;
          const isNew = recentlyCreatedId && row.original.id === recentlyCreatedId;
          return (
            <div className="flex items-center gap-2">
              <code className="text-sm font-medium">{orderNo}</code>
              {isNew && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  New
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status as AsnOrderStatus;
          const statusBadge = getStatusBadge(status);
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'order_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
        cell: ({ row }) => {
          const orderDate = row.original.order_date;
          return <span className="text-sm">{formatDate(orderDate, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'to_warehouse',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Target Warehouse" />,
        cell: ({ row }) => {
          const toWarehouse = row.original.to_warehouse;
          return toWarehouse?.name ? (
            <span className="text-sm">{toWarehouse.name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'vehicle_arrivals',
        header: () => <span>Vehicle</span>,
        cell: ({ row }) => {
          const arrivals = row.original.vehicle_arrivals ?? [];
          const vehicleNumbers = Array.from(
            new Set(
              arrivals
                .map((arrival) => arrival.vehicle_no)
                .filter((vehicleNo): vehicleNo is string => Boolean(vehicleNo))
            )
          );

          if (vehicleNumbers.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
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
                    <div key={arrival.id} className="text-xs">
                      <p className="font-medium">{arrival.vehicle_no ?? 'Vehicle unavailable'}</p>
                      <p className="text-muted-foreground">
                        {[arrival.driver_name, arrival.transporter, arrival.dock]
                          .filter(Boolean)
                          .join(' · ') || 'No additional arrival details'}
                      </p>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
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
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const order = row.original;
          const isDraft = order.status === 'draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(order)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {isDraft && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(order)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(order)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onView, onEdit, onDelete, recentlyCreatedId]
  );

  const renderViewOptions = (table: Table<AsnOrder>) => {
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null;
  };

  const getRowClassName = React.useCallback((row: AsnOrder) => {
    if (recentlyCreatedId && row.id === recentlyCreatedId) {
      return 'animate-flash-green';
    }
    return undefined;
  }, [recentlyCreatedId]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-4 text-destructive text-sm border-b">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading ASN Orders...</p>
          </div>
          <TableSkeleton columns={6} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (asnOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No ASN orders found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Advance Stock Notice orders will appear here once you create them'
              }
              action={
                !hasActiveFilters && onCreateOrder ? (
                  <Button onClick={onCreateOrder} className="gap-2">
                    Create ASN Order
                  </Button>
                ) : undefined
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={asnOrders}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: false,
            enableColumnVisibility: true,
            enableSorting: true,
            enableFiltering: false,
            initialPageSize: serverPagination?.pageSize ?? 20,
            serverPagination: serverPaginationConfig,
          }}
          filterPlaceholder="Search by ASN order number..."
          renderViewOptions={renderViewOptions}
          getRowClassName={getRowClassName}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
