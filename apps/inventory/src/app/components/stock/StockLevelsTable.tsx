import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Badge, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { StockLevel } from '../../types/stock.types';
import { formatDate, formatQuantity } from '../../utility';

function getStockStatusBadge(quantityAvailable: number) {
  if (quantityAvailable === 0) {
    return { variant: 'destructive' as const, label: 'Out of Stock', icon: AlertTriangle };
  }
  if (quantityAvailable < 10) {
    return { variant: 'warning' as const, label: 'Low Stock', icon: AlertTriangle };
  }
  return { variant: 'success' as const, label: 'In Stock', icon: CheckCircle2 };
}

export interface StockLevelsTableProps {
  stockLevels: StockLevel[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onTableReady?: (table: Table<StockLevel>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function StockLevelsTable({ stockLevels, loading, error, hasActiveFilters, onTableReady, serverPagination }: StockLevelsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<StockLevel> | null>(null);

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

  const columns: ColumnDef<StockLevel, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'product_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item Name / Code" />,
        cell: ({ row }) => {
          const stockLevel = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{stockLevel.product_name || 'Unknown Item'}</p>
                <code className="text-xs text-muted-foreground">{stockLevel.product_code || 'N/A'}</code>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'warehouse_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
        cell: ({ row }) => {
          const warehouseName = row.original.warehouse_name;
          return warehouseName ? <span className="text-sm">{warehouseName}</span> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: 'quantity_on_hand',
        header: ({ column }) => <DataTableColumnHeader column={column} title="On Hand" />,
        cell: ({ row }) => {
          const quantity = row.original.quantity_on_hand;
          return <div className="text-right font-medium">{formatQuantity(quantity)}</div>;
        },
      },
      {
        accessorKey: 'quantity_reserved',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reserved" />,
        cell: ({ row }) => {
          const quantity = row.original.quantity_reserved;
          return <div className="text-right text-muted-foreground">{formatQuantity(quantity)}</div>;
        },
      },
      {
        accessorKey: 'quantity_available',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
        cell: ({ row }) => {
          const quantity = row.original.quantity_available;
          const statusBadge = getStockStatusBadge(quantity);
          const StatusIcon = statusBadge.icon;

          return (
            <div className="flex items-center gap-2">
              <div className="text-right font-medium flex-1">{formatQuantity(quantity)}</div>
              <StatusIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        },
      },
      {
        id: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const quantity = row.original.quantity_available;
          const statusBadge = getStockStatusBadge(quantity);
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'last_counted_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Counted" />,
        cell: ({ row }) => {
          const lastCounted = row.original.last_counted_at;
          return lastCounted ? (
            <span className="text-sm">{formatDate(lastCounted, 'DD-MMM-YY')}</span>
          ) : (
            <span className="text-muted-foreground">Never</span>
          );
        },
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        cell: ({ row }) => {
          const updatedAt = row.original.updated_at;
          return <span className="text-sm">{formatDate(updatedAt, 'DD-MMM-YY', { includeTime: true })}</span>;
        },
      },
    ],
    [],
  );

  const renderViewOptions = (table: Table<StockLevel>) => {
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
          <TableSkeleton columns={8} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (stockLevels.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="No stock levels found"
              description={
                hasActiveFilters ? 'Try adjusting your search or filters' : 'Stock levels will appear here once items are added to warehouses'
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
          data={stockLevels}
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
          filterPlaceholder="Search by item name, code, or warehouse..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
