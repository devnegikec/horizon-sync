import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, Plus, MoreHorizontal, Eye, Trash2, CheckCircle, Mail, User } from 'lucide-react';

import { Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { Invoice } from '../../types/invoice.types';
import { formatDate } from '../../utility/formatDate';

import { InvoiceStatusBadge } from './InvoiceStatusBadge';

export interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onMarkAsPaid: (invoice: Invoice) => void;
  onCreateInvoice: () => void;
  onTableReady?: (table: Table<Invoice>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function InvoicesTable({
  invoices,
  loading,
  error,
  hasActiveFilters,
  onView,
  onDelete,
  onMarkAsPaid,
  onCreateInvoice,
  onTableReady,
  serverPagination,
}: InvoicesTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<Invoice> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<Invoice>) => {
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

  const columns: ColumnDef<Invoice, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'invoice_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{invoice.invoice_no}</p>
                <p className="text-xs text-muted-foreground">{formatDate(invoice.created_at, 'DD-MMM-YY')}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'invoice_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const type = row.original.invoice_type;
          return (
            <span className="text-sm capitalize">
              {type === 'sales' ? 'Sales' : 'Purchase'}
            </span>
          );
        },
      },
      {
        accessorKey: 'party_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Party" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return invoice.party_name ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm">{invoice.party_name}</p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'posting_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Posting Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.posting_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'due_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{row.original?.due_date && formatDate(row.original.due_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'grand_total',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div className="text-right">
              <p className="font-semibold">
                {invoice.currency} {Number(invoice.grand_total).toFixed(2)}
              </p>
              {invoice.outstanding_amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Due: {invoice.currency} {Number(invoice.outstanding_amount).toFixed(2)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          return <InvoiceStatusBadge status={row.original.status} />;
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const invoice = row.original;
          const canDelete = invoice.status === 'draft';
          const canMarkPaid = invoice.status !== 'paid' && invoice.status !== 'cancelled';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(invoice)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canMarkPaid && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onMarkAsPaid(invoice)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(invoice)}
                        className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Invoice
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
    [onView, onDelete, onMarkAsPaid]
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

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<FileText className="h-12 w-12" />}
              title="No invoices found"
              description={
                hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first invoice'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateInvoice} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Invoice
                  </Button>
                ) : undefined
              }/>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={invoices}
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
          filterPlaceholder="Search by invoice #, party..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
