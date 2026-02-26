import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, Plus, MoreHorizontal, Eye, Edit, Trash2, Send, XCircle } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { MaterialRequestListItem, MaterialRequestStatus } from '../../types/material-request.types';
import { formatDate } from '../../utility/formatDate';

export interface MaterialRequestsTableProps {
  materialRequests: MaterialRequestListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (mr: MaterialRequestListItem) => void;
  onEdit: (mr: MaterialRequestListItem) => void;
  onDelete: (mr: MaterialRequestListItem) => void;
  onSubmit: (mr: MaterialRequestListItem) => void;
  onCancel: (mr: MaterialRequestListItem) => void;
  onCreateMaterialRequest: () => void;
  onTableReady?: (table: Table<MaterialRequestListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

const STATUS_COLORS: Record<MaterialRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  partially_quoted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  fully_quoted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export function MaterialRequestsTable({
  materialRequests,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
  onCreateMaterialRequest,
  onTableReady,
  serverPagination
}: MaterialRequestsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<MaterialRequestListItem> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<MaterialRequestListItem>) => {
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

  const columns: ColumnDef<MaterialRequestListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'request_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Request #" />,
        cell: ({ row }) => {
          const mr = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{mr.request_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(mr.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge variant="outline" className="capitalize">
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ row }) => {
          const priority = row.original.priority;
          const priorityColors = {
            low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
            urgent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          };
          return (
            <Badge variant="secondary" className={`capitalize ${priorityColors[priority]}`}>
              {priority}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'department',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
        cell: ({ row }) => {
          const department = row.original.department;
          return department ? (
            <span className="text-sm">{department}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
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
          const status = row.original.status;
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
          const mr = row.original;
          const canEdit = mr.status === 'draft';
          const canDelete = mr.status === 'draft';
          const canSubmit = mr.status === 'draft';
          const canCancel = mr.status === 'draft' || mr.status === 'submitted';
          
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(mr)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(mr)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Request
                    </DropdownMenuItem>
                  )}
                  {canSubmit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onSubmit(mr)}>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </DropdownMenuItem>
                    </>
                  )}
                  {canCancel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onCancel(mr)}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Request
                      </DropdownMenuItem>
                    </>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(mr)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Request
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
    [onView, onEdit, onDelete, onSubmit, onCancel],
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

  if (materialRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState 
              icon={<FileText className="h-12 w-12" />}
              title="No material requests found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first material request'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateMaterialRequest} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Material Request
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
          data={materialRequests}
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
          filterPlaceholder="Search by request #, department..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
