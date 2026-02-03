import * as React from 'react';

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';

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

interface WarehouseRowProps {
  warehouse: Warehouse;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
}

function WarehouseRow({ warehouse, onView, onEdit, onDelete }: WarehouseRowProps) {
  const TypeIcon = getWarehouseTypeIcon(warehouse.warehouse_type);
  const typeBadge = getWarehouseTypeBadge(warehouse.warehouse_type);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{warehouse.name}</p>
            <code className="text-xs text-muted-foreground">{warehouse.code}</code>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
      </TableCell>
      <TableCell>
        {warehouse.city ? (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {warehouse.city}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {warehouse.parent ? <span className="text-sm">{warehouse.parent.name}</span> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <Badge variant={warehouse.is_active ? 'success' : 'secondary'}>{warehouse.is_active ? 'Active' : 'Inactive'}</Badge>
      </TableCell>
      <TableCell>{warehouse.is_default && <Badge variant="outline">Default</Badge>}</TableCell>
      <TableCell>{formatDate(warehouse.created_at, 'DD-MMM-YY')}</TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
}

interface WarehousesTableProps {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onCreateWarehouse: () => void;
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
}: WarehousesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {error && <div className="p-4 text-destructive text-sm border-b">{error}</div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <TableSkeleton columns={8} rows={5} showHeader={false} />
                </TableCell>
              </TableRow>
            ) : warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={<WarehouseIcon className="h-12 w-12" />}
                    title="No warehouses found"
                    description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first warehouse'}
                    action={!hasActiveFilters && <Button onClick={onCreateWarehouse} className="gap-2"><Plus className="h-4 w-4" />Add Warehouse</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <WarehouseRow key={warehouse.id} warehouse={warehouse} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}