import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Power,
  PowerOff,
  Trash2,
  Building2,
  Store,
  Truck,
  MapPin,
} from 'lucide-react';

import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { Warehouse } from '../../types/warehouse.types';
import { formatDate } from '../../utility/formatDate';

function getWarehouseTypeIcon(type: string) {
  switch (type) {
    case 'warehouse':
      return Building2;
    case 'store':
      return Store;
    case 'transit':
      return Truck;
    default:
      return WarehouseIcon;
  }
}

function getWarehouseTypeBadge(type: string) {
  switch (type) {
    case 'warehouse':
      return { variant: 'default' as const, label: 'Warehouse' };
    case 'store':
      return { variant: 'secondary' as const, label: 'Store' };
    case 'transit':
      return { variant: 'outline' as const, label: 'Transit' };
    default:
      return { variant: 'outline' as const, label: type };
  }
}

export interface WarehousesTableProps {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onCreateWarehouse: () => void;
  onTableReady?: (table: Table<Warehouse>) => void;
}

export function WarehousesTable({
  warehouses,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateWarehouse,
  onTableReady,
}: WarehousesTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<Warehouse> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  const columns: ColumnDef<Warehouse, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Warehouse" />,
        cell: ({ row }) => {
          const warehouse = row.original;
          const TypeIcon = getWarehouseTypeIcon(warehouse.warehouse_type);
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TypeIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{warehouse.name}</p>
                <code className="text-xs text-muted-foreground">{warehouse.code}</code>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'warehouse_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const typeBadge = getWarehouseTypeBadge(row.original.warehouse_type);
          return <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'city',
        header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
        cell: ({ row }) => {
          const city = row.original.city;
          return city ? (
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {city}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'parent',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Parent" />,
        cell: ({ row }) => {
          const parent = row.original.parent;
          return parent ? (
            <span className="text-sm">{parent.name}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return (
            <Badge variant={isActive ? 'success' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'is_default',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Default" />,
        cell: ({ row }) => {
          const isDefault = row.original.is_default;
          return isDefault ? <Badge variant="outline">Default</Badge> : null;
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
          const warehouse = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(warehouse)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Warehouse
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {warehouse.is_active ? (
                    <DropdownMenuItem onClick={() => onDelete(warehouse)}>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onDelete(warehouse)}>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDelete(warehouse)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
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

  const renderViewOptions = (table: Table<Warehouse>) => {
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
          <div className="py-12 text-center text-muted-foreground">Loading…</div>
        </CardContent>
      </Card>
    );
  }

  if (warehouses.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<WarehouseIcon className="h-12 w-12" />}
              title="No warehouses found"
              description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first warehouse'}
              action={!hasActiveFilters ? <Button onClick={onCreateWarehouse} className="gap-2"><Plus className="h-4 w-4" />Add Warehouse</Button> : undefined}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable<Warehouse, unknown> 
          columns={columns} 
          data={warehouses} 
          config={{ 
            showSerialNumber: true, 
            showPagination: true, 
            enableRowSelection: false, 
            enableColumnVisibility: true, 
            enableSorting: true, 
            enableFiltering: true, 
            initialPageSize: 20 
          }} 
          filterPlaceholder="Search by name, code, or city..." 
          renderViewOptions={renderViewOptions}
          fixedHeader 
          maxHeight="600px" 
        />
      </CardContent>
    </Card>
  );
}