import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { FileText, Plus, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

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

import type { StockReconciliation, StockReconciliationStatus } from '../../types/stock.types';
import { formatDate, formatCurrency, formatQuantity } from '../../utility';

function getStatusBadge(status: StockReconciliationStatus) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Submitted' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

export interface StockReconciliationsTableProps {
  stockReconciliations: StockReconciliation[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (reconciliation: StockReconciliation) => void;
  onEdit?: (reconciliation: StockReconciliation) => void;
  onDelete?: (reconciliation: StockReconciliation) => void;
  onCreateReconciliation?: () => void;
  onTableReady?: (table: Table<StockReconciliation>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function StockReconciliationsTable({
  stockReconciliations,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateReconciliation,
  onTableReady,
  serverPagination,
}: StockReconciliationsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<StockReconciliation> | null>(null);

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
      currentPage: serverPagination.pageIndex + 1,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<StockReconciliation, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'reconciliation_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reconciliation No" />,
        cell: ({ row }) => {
          const reconciliationNo = row.original.reconciliation_no;
          return <code className="text-sm font-medium">{reconciliationNo}</code>;
        },
      },
      {
        accessorKey: 'posting_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => {
          const postingDate = row.original.posting_date;
          return <span className="text-sm">{formatDate(postingDate, 'DD-MMM-YY')}</span>;
        },
      },
      {
        accessorKey: 'purpose',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Purpose" />,
        cell: ({ row }) => {
          const purpose = row.original.purpose;
          return purpose ? (
            <span className="text-sm">{purpose}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusBadge = getStatusBadge(status);
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'items_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Items Count" />,
        cell: ({ row }) => {
          const itemsCount = row.original.items_count;
          return <div className="text-right">{formatQuantity(itemsCount)}</div>;
        },
      },
      {
        accessorKey: 'total_difference',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Difference" />,
        cell: ({ row }) => {
          const totalDifference = row.original.total_difference;
          return totalDifference ? (
            <div className="text-right font-medium">{formatCurrency(Number(totalDifference))}</div>
          ) : (
            <div className="text-right text-muted-foreground">—</div>
          );
        },
      },
      {
        accessorKey: 'remarks',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Remarks" />,
        cell: ({ row }) => {
          const remarks = row.original.remarks;
          return remarks ? (
            <span className="text-sm truncate max-w-xs block" title={remarks}>
              {remarks}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const reconciliation = row.original;
          const isDraft = reconciliation.status === 'draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(reconciliation)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {isDraft && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(reconciliation)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Reconciliation
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete?.(reconciliation)}
                        className="text-destructive focus:text-destructive">
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
    [onView, onEdit, onDelete]
  );

  const renderViewOptions = (table: Table<StockReconciliation>) => {
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
          <TableSkeleton columns={8} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (stockReconciliations.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<FileText className="h-12 w-12" />}
              title="No stock reconciliations found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Stock reconciliations will appear here once you create them'
              }
              action={
                !hasActiveFilters && onCreateReconciliation ? (
                  <Button onClick={onCreateReconciliation} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Stock Reconciliation
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
          data={stockReconciliations}
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
          filterPlaceholder="Search by reconciliation number..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
