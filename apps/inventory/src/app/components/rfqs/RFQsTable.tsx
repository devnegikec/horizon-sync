import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, Plus, MoreHorizontal, Eye, Edit, Trash2, Send, XCircle } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { RFQListItem, RFQStatus } from '../../types/rfq.types';
import { formatDate } from '../../utility/formatDate';

export interface RFQsTableProps {
  rfqs: RFQListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (rfq: RFQListItem) => void;
  onEdit: (rfq: RFQListItem) => void;
  onDelete: (rfq: RFQListItem) => void;
  onSend: (rfq: RFQListItem) => void;
  onClose: (rfq: RFQListItem) => void;
  onCreateRFQ: () => void;
  onTableReady?: (table: Table<RFQListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

const STATUS_COLORS: Record<RFQStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  partially_responded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  fully_responded: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export function RFQsTable({
  rfqs,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onSend,
  onClose,
  onCreateRFQ,
  onTableReady,
  serverPagination
}: RFQsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<RFQListItem> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<RFQListItem>) => {
    // Set table instance in state, which will trigger useEffect
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null; // Don't render anything in the table
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

  const columns: ColumnDef<RFQListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="RFQ #" />,
        cell: ({ row }) => {
          const rfq = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">RFQ-{rfq.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(rfq.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'material_request_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Material Request" />,
        cell: ({ row }) => {
          const mrId = row.original.material_request_id;
          return mrId ? (
            <span className="text-sm font-mono">{mrId.slice(0, 8)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'closing_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Closing Date" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.closing_date, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'suppliers_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Suppliers" />,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className="text-sm font-medium">{row.original.suppliers_count ?? 0}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'line_items_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
        cell: ({ row }) => {
          return (
            <div className="text-center">
              <span className="text-sm font-medium">{row.original.line_items_count ?? 0}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status as RFQStatus;
          return (
            <Badge variant="secondary" className={STATUS_COLORS[status]}>
              {status.replace(/_/g, ' ')}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const rfq = row.original;
          const canEdit = rfq.status === 'draft';
          const canDelete = rfq.status === 'draft';
          const canSend = rfq.status === 'draft';
          const canClose = rfq.status === 'sent' || rfq.status === 'partially_responded' || rfq.status === 'fully_responded';
          
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(rfq)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(rfq)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit RFQ
                    </DropdownMenuItem>
                  )}
                  {canSend && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onSend(rfq)}>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Suppliers
                      </DropdownMenuItem>
                    </>
                  )}
                  {canClose && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onClose(rfq)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Close RFQ
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(rfq)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete RFQ
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
    [onView, onEdit, onDelete, onSend, onClose],
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
          <TableSkeleton columns={7} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (rfqs.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState 
              icon={<FileText className="h-12 w-12" />}
              title="No RFQs found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first RFQ'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateRFQ} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New RFQ
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
          data={rfqs}
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
          filterPlaceholder="Search by RFQ #, material request..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
