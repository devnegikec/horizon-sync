import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { ArrowDownUp, TrendingUp, TrendingDown, RefreshCw, Package } from 'lucide-react';

import { Badge, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { StockMovement } from '../../types/stock.types';
import { formatDate, formatCurrency, formatQuantity } from '../../utility';

function getMovementTypeBadge(movementType: string) {
  switch (movementType) {
    case 'in':
      return { variant: 'success' as const, label: 'Stock In', icon: TrendingUp };
    case 'out':
      return { variant: 'destructive' as const, label: 'Stock Out', icon: TrendingDown };
    case 'transfer':
      return { variant: 'default' as const, label: 'Transfer', icon: ArrowDownUp };
    case 'adjustment':
      return { variant: 'warning' as const, label: 'Adjustment', icon: RefreshCw };
    default:
      return { variant: 'outline' as const, label: movementType, icon: Package };
  }
}

export interface StockMovementsTableProps {
  stockMovements: StockMovement[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onTableReady?: (table: Table<StockMovement>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function StockMovementsTable({ stockMovements, loading, error, hasActiveFilters, onTableReady, serverPagination }: StockMovementsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<StockMovement> | null>(null);

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

  const columns: ColumnDef<StockMovement, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'performed_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date/Time" />,
        cell: ({ row }) => {
          const performedAt = row.original.performed_at;
          return <span className="text-sm">{formatDate(performedAt, 'DD-MMM-YY', { includeTime: true })}</span>;
        },
      },
      {
        accessorFn: (row) => row.product?.name || row.product_name || '',
        id: 'product_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
        cell: ({ row }) => {
          const movement = row.original;
          // Use nested product object if available, otherwise fall back to flat fields
          const productName = movement.product?.name || movement.product_name || 'Unknown Item';
          const productCode = movement.product?.code || movement.product_code || 'N/A';
          return (
            <div>
              <p className="font-medium text-sm">{productName}</p>
              <code className="text-xs text-muted-foreground">{productCode}</code>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.warehouse?.name || row.warehouse_name || '',
        id: 'warehouse_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
        cell: ({ row }) => {
          const movement = row.original;
          // Use nested warehouse object if available, otherwise fall back to flat fields
          const warehouseName = movement.warehouse?.name || movement.warehouse_name;
          const warehouseCode = movement.warehouse?.code;
          return warehouseName ? (
            <div>
              <span className="text-sm">{warehouseName}</span>
              {warehouseCode && (
                <code className="text-xs text-muted-foreground block">{warehouseCode}</code>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'movement_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const movementType = row.original.movement_type;
          const typeBadge = getMovementTypeBadge(movementType);
          const TypeIcon = typeBadge.icon;
          return (
            <Badge variant={typeBadge.variant} className="gap-1">
              <TypeIcon className="h-3 w-3" />
              {typeBadge.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
        cell: ({ row }) => {
          const quantity = row.original.quantity;
          const movementType = row.original.movement_type;
          const isPositive = movementType === 'in';
          return (
            <div className={`text-right font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : '-'}
              {formatQuantity(Math.abs(quantity))}
            </div>
          );
        },
      },
      {
        accessorKey: 'unit_cost',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Unit Cost" />,
        cell: ({ row }) => {
          const unitCost = row.original.unit_cost;
          return unitCost ? (
            <div className="text-right text-sm">{formatCurrency(Number(unitCost))}</div>
          ) : (
            <div className="text-right text-muted-foreground">—</div>
          );
        },
      },
      {
        id: 'reference',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
        cell: ({ row }) => {
          const movement = row.original;
          const referenceType = movement.reference_type;
          const referenceId = movement.reference_id;

          if (!referenceType && !referenceId) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }

          return (
            <div className="text-sm">
              {referenceType && <span className="text-muted-foreground">{referenceType}: </span>}
              {referenceId && <code className="text-xs">{referenceId.substring(0, 8)}</code>}
            </div>
          );
        },
      },
      {
        accessorKey: 'performed_by_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Performed By" />,
        cell: ({ row }) => {
          const performedBy = row.original.performed_by_name;
          return performedBy ? <span className="text-sm">{performedBy}</span> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        accessorKey: 'notes',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Notes" />,
        cell: ({ row }) => {
          const notes = row.original.notes;
          return notes ? (
            <span className="text-sm truncate max-w-xs block" title={notes}>
              {notes}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
    ],
    [],
  );

  const renderViewOptions = (table: Table<StockMovement>) => {
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
          <TableSkeleton columns={9} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (stockMovements.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Package className="h-12 w-12" />}
              title="No stock movements found"
              description={
                hasActiveFilters ? 'Try adjusting your search or filters' : 'Stock movements will appear here once inventory transactions occur'
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
          data={stockMovements}
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
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
