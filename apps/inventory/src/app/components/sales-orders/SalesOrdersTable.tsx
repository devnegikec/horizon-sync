import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { ShoppingCart, Plus, MoreHorizontal, Eye, Edit, Trash2, User, FileText } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { SalesOrder } from '../../types/sales-order.types';
import { formatDate } from '../../utility/formatDate';
import { StatusBadge } from '../quotations/StatusBadge';

export interface SalesOrdersTableProps {
  salesOrders: SalesOrder[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (salesOrder: SalesOrder) => void;
  onEdit: (salesOrder: SalesOrder) => void;
  onDelete: (salesOrder: SalesOrder) => void;
  onCreateSalesOrder: () => void;
  onTableReady?: (table: Table<SalesOrder>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function SalesOrdersTable({
  salesOrders,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateSalesOrder,
  onTableReady,
  serverPagination,
}: SalesOrdersTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<SalesOrder> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<SalesOrder>) => {
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null;
  };

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

  const columns: ColumnDef<SalesOrder, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'sales_order_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sales Order #" />,
        cell: ({ row }) => {
          const so = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{so.sales_order_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(so.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'customer_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => {
          const customerName = row.original.customer_name;
          return customerName ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">{customerName}</p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'order_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.order_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'delivery_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Date" />,
        cell: ({ row }) => {
          const dd = row.original.delivery_date;
          return <span className="text-sm">{dd ? formatDate(dd, 'DD-MMM-YY') : '—'}</span>;
        },
      },
      {
        accessorKey: 'grand_total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Grand Total" />,
        cell: ({ row }) => {
          const so = row.original;
          return (
            <div className="text-right">
              <p className="font-semibold">{so.currency} {Number(so.grand_total).toFixed(2)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          return <StatusBadge status={row.original.status} />;
        },
      },
      {
        id: 'reference',
        header: () => <span className="text-sm font-medium">Ref</span>,
        cell: ({ row }) => {
          const so = row.original;
          if (so.reference_type === 'Quotation' && so.reference_id) {
            return (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400" title="From Quotation">
                <FileText className="h-4 w-4" />
              </div>
            );
          }
          return <span className="text-muted-foreground">—</span>;
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const so = row.original;
          const canEdit = so.status !== 'closed' && so.status !== 'cancelled';
          const canDelete = so.status === 'draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(so)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(so)} disabled={!canEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Sales Order
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(so)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Sales Order
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
    [onView, onEdit, onDelete],
  );

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
          <TableSkeleton columns={8} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (salesOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<ShoppingCart className="h-12 w-12" />}
              title="No sales orders found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first sales order'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateSalesOrder} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Sales Order
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
          data={salesOrders}
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
          filterPlaceholder="Search by order #, customer..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
