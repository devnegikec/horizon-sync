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

import type { StockEntry, StockEntryStatus } from '../../types/stock.types';
import { formatDate, formatCurrency } from '../../utility';

function getEntryTypeBadge(entryType: string) {
  switch (entryType) {
    case 'material_receipt':
      return { variant: 'success' as const, label: 'Receipt' };
    case 'material_issue':
      return { variant: 'destructive' as const, label: 'Issue' };
    case 'material_transfer':
      return { variant: 'default' as const, label: 'Transfer' };
    case 'manufacture':
      return { variant: 'secondary' as const, label: 'Manufacture' };
    case 'repack':
      return { variant: 'outline' as const, label: 'Repack' };
    default:
      return { variant: 'outline' as const, label: entryType };
  }
}

function getStatusBadge(status: StockEntryStatus) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Submitted' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
    default:
      return { variant: 'outline' as const, label: status };
  }
}

export interface StockEntriesTableProps {
  stockEntries: StockEntry[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (entry: StockEntry) => void;
  onEdit?: (entry: StockEntry) => void;
  onDelete?: (entry: StockEntry) => void;
  onCreateEntry?: () => void;
  onTableReady?: (table: Table<StockEntry>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function StockEntriesTable({
  stockEntries,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateEntry,
  onTableReady,
  serverPagination,
}: StockEntriesTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<StockEntry> | null>(null);

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

  const columns: ColumnDef<StockEntry, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'stock_entry_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entry No" />,
        cell: ({ row }) => {
          const entryNo = row.original.stock_entry_no;
          return <code className="text-sm font-medium">{entryNo}</code>;
        },
      },
      {
        accessorKey: 'stock_entry_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const entryType = row.original.stock_entry_type;
          const typeBadge = getEntryTypeBadge(entryType);
          return <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>;
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
        accessorKey: 'from_warehouse_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="From Warehouse" />,
        cell: ({ row }) => {
          const fromWarehouse = row.original.from_warehouse_name;
          return fromWarehouse ? (
            <span className="text-sm">{fromWarehouse}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'to_warehouse_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="To Warehouse" />,
        cell: ({ row }) => {
          const toWarehouse = row.original.to_warehouse_name;
          return toWarehouse ? (
            <span className="text-sm">{toWarehouse}</span>
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
        accessorKey: 'total_value',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Value" />,
        cell: ({ row }) => {
          const totalValue = row.original.total_value;
          return totalValue ? (
            <div className="text-right font-medium">{formatCurrency(Number(totalValue))}</div>
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
          const entry = row.original;
          const isDraft = entry.status === 'draft';

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(entry)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {isDraft && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Entry
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete?.(entry)}
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

  const renderViewOptions = (table: Table<StockEntry>) => {
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
          <TableSkeleton columns={9} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (stockEntries.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<FileText className="h-12 w-12" />}
              title="No stock entries found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Stock entries will appear here once you create them'
              }
              action={
                !hasActiveFilters && onCreateEntry ? (
                  <Button onClick={onCreateEntry} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Stock Entry
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
          data={stockEntries}
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
          filterPlaceholder="Search by entry number..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
