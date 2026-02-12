import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, Plus, MoreHorizontal, Eye, Edit, Trash2, User } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { Quotation } from '../../types/quotation.types';
import { formatDate } from '../../utility/formatDate';
import { StatusBadge } from './StatusBadge';

export interface QuotationsTableProps {
  quotations: Quotation[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onCreateQuotation: () => void;
  onTableReady?: (table: Table<Quotation>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function QuotationsTable({
  quotations,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateQuotation,
  onTableReady,
  serverPagination
}: QuotationsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<Quotation> | null>(null);

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

  const columns: ColumnDef<Quotation, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'quotation_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Quotation #" />,
        cell: ({ row }) => {
          const quotation = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{quotation.quotation_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(quotation.created_at, 'DD-MMM-YY')}
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
          const customer = row.original.customer;
          const customerName = row.original.customer_name || customer?.customer_name;
          return customerName ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{customerName}</p>
                {customer?.customer_code && (
                  <p className="text-xs text-muted-foreground">{customer.customer_code}</p>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'quotation_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Quotation Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.quotation_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'valid_until',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Valid Until" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.valid_until, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'grand_total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Grand Total" />,
        cell: ({ row }) => {
          const quotation = row.original;
          return (
            <div className="text-right">
              <p className="font-semibold">{quotation.currency} {Number(quotation.grand_total).toFixed(2)}</p>
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
          const quotation = row.original;
          const canEdit = quotation.status !== 'accepted' && quotation.status !== 'rejected' && quotation.status !== 'expired';
          const canDelete = quotation.status === 'draft';
          
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(quotation)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(quotation)} disabled={!canEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Quotation
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(quotation)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Quotation
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

  const renderViewOptions = (table: Table<Quotation>) => {
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null;
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

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState 
              icon={<FileText className="h-12 w-12" />}
              title="No quotations found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first quotation'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateQuotation} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Quotation
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
          data={quotations}
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
          filterPlaceholder="Search by quotation #, customer..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
