import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Link2, Plus, MoreHorizontal, Edit, Trash2, Clock, Star, Package } from 'lucide-react';

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

import type { ItemSupplier } from '../../types/supplier.types';
import { formatDate } from '../../utility/formatDate';

export interface SuppliersTableProps {
  itemSuppliers: ItemSupplier[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  itemMap: Map<string, string>;
  supplierMap: Map<string, string>;
  onEdit: (itemSupplier: ItemSupplier) => void;
  onDelete: (itemSupplier: ItemSupplier) => void;
  onCreateLink: () => void;
  onTableReady?: (table: Table<ItemSupplier>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function SuppliersTable({
  itemSuppliers,
  loading,
  error,
  hasActiveFilters,
  itemMap,
  supplierMap,
  onEdit,
  onDelete,
  onCreateLink,
  onTableReady,
  serverPagination,
}: SuppliersTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<ItemSupplier> | null>(null);

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

  const columns: ColumnDef<ItemSupplier, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'item_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
        cell: ({ row }) => {
          const itemSupplier = row.original;
          const itemName = itemMap.get(itemSupplier.item_id) || 'Unknown Item';
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{itemName}</p>
                <code className="text-xs text-muted-foreground">{itemSupplier.item_id.slice(0, 8)}...</code>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'supplier_id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
        cell: ({ row }) => {
          const itemSupplier = row.original;
          const supplierName = supplierMap.get(itemSupplier.supplier_id) || 'Unknown Supplier';
          return (
            <div>
              <p className="font-medium">{supplierName}</p>
              <code className="text-xs text-muted-foreground">{itemSupplier.supplier_id.slice(0, 8)}...</code>
            </div>
          );
        },
      },
      {
        accessorKey: 'supplier_part_no',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier Part No." />,
        cell: ({ row }) => {
          const partNo = row.original.supplier_part_no;
          return partNo ? (
            <code className="text-sm bg-muted px-2 py-0.5 rounded">{partNo}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'lead_time_days',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Lead Time" />,
        cell: ({ row }) => {
          const leadTime = row.original.lead_time_days;
          return leadTime !== undefined ? (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{leadTime} days</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'is_default',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isDefault = row.original.is_default;
          return isDefault ? (
            <Badge variant="success" className="gap-1">
              <Star className="h-3 w-3" />
              Default
            </Badge>
          ) : (
            <Badge variant="secondary">Alternative</Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
        cell: ({ row }) => formatDate(row.original.created_at, 'DD-MMM-YY'),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const itemSupplier = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(itemSupplier)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(itemSupplier)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [itemMap, supplierMap, onEdit, onDelete]
  );

  const renderViewOptions = (table: Table<ItemSupplier>) => {
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

  if (itemSuppliers.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Link2 className="h-12 w-12" />}
              title="No item-supplier links found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Link items to suppliers to manage procurement and lead times'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateLink} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Link Item to Supplier
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
          data={itemSuppliers}
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
          filterPlaceholder="Search by item, supplier, or part no..."
          renderViewOptions={renderViewOptions}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
