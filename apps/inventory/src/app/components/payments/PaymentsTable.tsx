import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Wallet, Plus, MoreHorizontal, Eye, Edit, Trash2, User } from 'lucide-react';

import { Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { Payment } from '../../types/payment';
import { formatDate } from '../../utility/formatDate';
import { StatusBadge } from '../quotations/StatusBadge';

export interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
  onCreatePayment: () => void;
  onTableReady?: (table: Table<Payment>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function PaymentsTable({
  payments,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreatePayment,
  onTableReady,
  serverPagination,
}: PaymentsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<Payment> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<Payment>) => {
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

  const columns: ColumnDef<Payment, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'payment_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Payment #" />,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{payment.payment_number}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(payment.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'party_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Party" />,
        cell: ({ row }) => {
          const payment = row.original;
          return payment.party_name ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{payment.party_name}</p>
                <p className="text-xs text-muted-foreground">{payment.party_type}</p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'payment_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.payment_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'payment_mode',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Mode" />,
        cell: ({ row }) => {
          return <span className="text-sm">{row.original.payment_mode}</span>;
        },
      },
      {
        accessorKey: 'total_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Amount" />,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="text-right">
              <p className="font-semibold">{payment.currency} {Number(payment.total_amount).toFixed(2)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'allocated_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Allocated" />,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="text-right">
              <p className="text-sm">{payment.currency} {Number(payment.allocated_amount).toFixed(2)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'unallocated_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Unallocated" />,
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="text-right">
              <p className="text-sm font-medium">{payment.currency} {Number(payment.unallocated_amount).toFixed(2)}</p>
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
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const payment = row.original;
          const canEdit = payment.status === 'Draft';
          const canDelete = payment.status === 'Draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(payment)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(payment)} disabled={!canEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Payment
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(payment)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Payment
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
          <TableSkeleton columns={9} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<Wallet className="h-12 w-12" />}
              title="No payments found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first payment'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreatePayment} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Payment
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
          data={payments}
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
          filterPlaceholder="Search by payment #, party..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
