import * as React from 'react';

import {
  Warehouse as WarehouseIcon,
  Plus,
  Download,
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
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { cn } from '@horizon-sync/ui/lib';

import { useWarehouses, useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, WarehouseFilters } from '../../types/warehouse.types';
import { formatDate } from '../../utility/formatDate';

import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { WarehouseDialog } from './WarehouseDialog';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

export function WarehouseManagement() {
  const { warehouses, pagination, loading, error, refetch } = useWarehouses(1, 50);
  const { deleteWarehouse } = useWarehouseMutations();
  const [filters, setFilters] = React.useState<WarehouseFilters>({
    search: '',
    warehouseType: 'all',
    status: 'all',
  });
  const [warehouseDialogOpen, setWarehouseDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<Warehouse | null>(null);

  const filteredWarehouses = React.useMemo(() => {
    return warehouses.filter((warehouse) => {
      const matchesSearch =
        filters.search === '' ||
        warehouse.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        warehouse.code.toLowerCase().includes(filters.search.toLowerCase()) ||
        (warehouse.city || '').toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = filters.warehouseType === 'all' || warehouse.warehouse_type === filters.warehouseType;

      const matchesStatus =
        filters.status === 'all' || (filters.status === 'active' && warehouse.is_active) || (filters.status === 'inactive' && !warehouse.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [warehouses, filters]);

  const stats = React.useMemo(() => {
    const total = pagination?.total_items ?? warehouses.length;
    const active = warehouses.filter((w) => w.is_active).length;
    const warehouseCount = warehouses.filter((w) => w.warehouse_type === 'warehouse').length;
    const storeCount = warehouses.filter((w) => w.warehouse_type === 'store').length;
    return { total, active, warehouseCount, storeCount };
  }, [warehouses, pagination]);

  const handleCreateWarehouse = () => {
    setSelectedWarehouse(null);
    setWarehouseDialogOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseDialogOpen(true);
  };

  const handleViewWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    if (window.confirm(`Are you sure you want to delete "${warehouse.name}"?`)) {
      try {
        await deleteWarehouse(warehouse.id);
        refetch();
      } catch {
        // Error handled in hook
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">Organize inventory across multiple locations and bins</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateWarehouse} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Locations"
          value={stats.total}
          icon={WarehouseIcon}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="Active Locations"
          value={stats.active}
          icon={Building2}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Warehouses"
          value={stats.warehouseCount}
          icon={Building2}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Stores"
          value={stats.storeCount}
          icon={Store}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          className="sm:w-80"
          placeholder="Search by name, code, or city..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />
        <div className="flex gap-3">
          <Select value={filters.warehouseType} onValueChange={(value) => setFilters((prev) => ({ ...prev, warehouseType: value }))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="store">Store</SelectItem>
              <SelectItem value="transit">Transit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Warehouses Table */}
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredWarehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={<WarehouseIcon className="h-12 w-12" />}
                      title="No warehouses found"
                      description={
                        filters.search || filters.warehouseType !== 'all' || filters.status !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Get started by adding your first warehouse'
                      }
                      action={
                        !filters.search &&
                        filters.warehouseType === 'all' &&
                        filters.status === 'all' && (
                          <Button onClick={handleCreateWarehouse} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Warehouse
                          </Button>
                        )
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarehouses.map((warehouse) => (
                  <WarehouseRow
                    key={warehouse.id}
                    warehouse={warehouse}
                    onView={handleViewWarehouse}
                    onEdit={handleEditWarehouse}
                    onDelete={handleDeleteWarehouse}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <WarehouseDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        warehouse={selectedWarehouse}
        warehouses={warehouses}
        onCreated={refetch}
        onUpdated={refetch}
      />
      <WarehouseDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} warehouse={selectedWarehouse} />
    </div>
  );
}
