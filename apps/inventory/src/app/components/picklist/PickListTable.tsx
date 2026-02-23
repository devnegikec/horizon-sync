import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, MoreHorizontal, Eye, Trash2, Package } from 'lucide-react';

import { Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { PickList } from '../../types/pick-list.types';
import { formatDate } from '../../utility/formatDate';

import { PickListStatusBadge } from './PickListStatusBadge';

export interface PickListTableProps {
  pickLists: PickList[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (pickList: PickList) => void;
  onDelete: (pickList: PickList) => void;
  onTableReady?: (table: Table<PickList>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function PickListTable({
  pickLists,
  loading,
  error,
  hasActiveFilters,
  onView,
  onDelete,
  onTableReady,
  serverPagination
}: PickListTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<PickList> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const renderViewOptions = (table: Table<PickList>) => {
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

  const columns: ColumnDef<PickList, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'pick_list_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pick List #" />,
        cell: ({ row }) => {
          const pickList = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium font-mono text-sm">{pickList.pick_list_no}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(pickList.created_at, 'DD-MMM-YY')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'sales_order_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sales Order" />,
        cell: ({ row }) => {
          const pickList = row.original;
          return pickList.sales_order_no ? (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium text-sm font-mono">{pickList.sales_order_no}</p>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'items_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
        cell: ({ row }) => {
          const itemsCount = row.original.items?.length || 0;
          return <span className="text-sm">{itemsCount} item{itemsCount !== 1 ? 's' : ''}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          return <PickListStatusBadge status={row.original.status} />;
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
          return <span className="text-sm">{formatDate(row.original.created_at, 'DD-MMM-YY', { includeTime: true })}</span>;
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const pickList = row.original;
          const canDelete = pickList.status === 'draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(pickList)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(pickList)}
                        className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Pick List
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
    [onView, onDelete],
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
          <TableSkeleton columns={6} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (pickLists.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Package className="h-12 w-12" />}
              title="No pick lists found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Pick lists are created from confirmed sales orders'
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
          data={pickLists}
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
          filterPlaceholder="Search by pick list #, sales order..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
