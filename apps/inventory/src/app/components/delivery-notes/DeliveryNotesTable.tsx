import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import {
  Truck,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  Package,
  User,
  Building2,
} from 'lucide-react';

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

import type { DeliveryNote } from '../../types/delivery-note.types';
import { formatDate } from '../../utility/formatDate';

function getStatusBadge(status: DeliveryNote['status']) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Shipped' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
  }
}

export interface DeliveryNotesTableProps {
  deliveryNotes: DeliveryNote[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (deliveryNote: DeliveryNote) => void;
  onEdit: (deliveryNote: DeliveryNote) => void;
  onDelete?: (deliveryNote: DeliveryNote) => void;
  onCreateDeliveryNote: () => void;
  onTableReady?: (table: Table<DeliveryNote>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function DeliveryNotesTable({
  deliveryNotes,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateDeliveryNote,
  onTableReady,
  serverPagination
}: DeliveryNotesTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<DeliveryNote> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  // Create server pagination config for DataTable
  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;

    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.pageIndex + 1, // Convert 0-based to 1-based
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize); // Convert 1-based to 0-based
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<DeliveryNote, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'delivery_note_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Note #" />,
        cell: ({ row }) => {
          const deliveryNote = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{deliveryNote.delivery_note_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(deliveryNote.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => {
          const customer = row.original.customer;
          return customer ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{customer.customer_name}</p>
                <p className="text-xs text-muted-foreground">{customer.customer_code}</p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'warehouse',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
        cell: ({ row }) => {
          const warehouse = row.original.warehouse;
          return warehouse ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{warehouse.warehouse_name}</p>
                <p className="text-xs text-muted-foreground">{warehouse.warehouse_code}</p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const badge = getStatusBadge(row.original.status);
          return <Badge variant={badge.variant}>{badge.label}</Badge>;
        },
      },
      {
        accessorKey: 'delivery_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Delivery Date" />,
        cell: ({ row }) => {
          const deliveryDate = row.original.delivery_date;
          return deliveryDate ? formatDate(deliveryDate, 'DD-MMM-YY') : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: 'remarks',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Remarks" />,
        cell: ({ row }) => {
          const remarks = row.original.remarks;
          return remarks ? (
            <span className="text-sm max-w-[200px] truncate">{remarks}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const deliveryNote = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(deliveryNote)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(deliveryNote)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Delivery Note
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(deliveryNote)}
                      className="text-destructive focus:text-destructive" >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Delivery Note
                    </DropdownMenuItem>
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

  const renderViewOptions = (table: Table<DeliveryNote>) => {
    // Set table instance in state, which will trigger useEffect
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null; // Don't render anything in the table
  };

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
          <TableSkeleton columns={7} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (deliveryNotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Package className="h-12 w-12" />}
              title="No delivery notes found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first delivery note'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateDeliveryNote} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Delivery Note
                  </Button>
                ) : undefined
              } />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={deliveryNotes}
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
          filterPlaceholder="Search by delivery note #, customer..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto" />
      </CardContent>
    </Card>
  );
}
