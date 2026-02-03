import * as React from 'react';

import {
  Warehouse as WarehouseIcon,
  Plus,
  Download,
  Building2,
  Store,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib';

import { useWarehouses, useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, WarehouseFilters } from '../../types/warehouse.types';

import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { WarehouseDialog } from './WarehouseDialog';
import { WarehousesTable } from './WarehousesTable';

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

export function WarehouseManagement() {
  const { warehouses, pagination, statusCounts, typeCounts, loading, error, refetch } = useWarehouses(1, 50);
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
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          warehouse.name.toLowerCase().includes(searchLower) ||
          warehouse.code.toLowerCase().includes(searchLower) ||
          (warehouse.city || '').toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.warehouseType !== 'all' && warehouse.warehouse_type !== filters.warehouseType) {
        return false;
      }

      if (filters.status !== 'all') {
        const isActive = filters.status === 'active';
        if (warehouse.is_active !== isActive) return false;
      }

      return true;
    });
  }, [warehouses, filters]);

  const stats = React.useMemo(() => {
    const total = pagination?.total_items ?? warehouses.length;
    const active = statusCounts?.active ?? warehouses.filter((w) => w.is_active).length;
    const warehouseCount = typeCounts?.warehouse ?? warehouses.filter((w) => w.warehouse_type === 'warehouse').length;
    const storeCount = typeCounts?.store ?? warehouses.filter((w) => w.warehouse_type === 'store').length;
    return { total, active, warehouseCount, storeCount };
  }, [warehouses, pagination, statusCounts, typeCounts]);

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
        <StatCard title="Total Locations" value={stats.total} icon={WarehouseIcon} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Locations" value={stats.active} icon={Building2} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Warehouses" value={stats.warehouseCount} icon={Building2} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard title="Stores" value={stats.storeCount} icon={Store} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput className="sm:w-80" placeholder="Search by name, code, or city..." onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
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
      <WarehousesTable
        warehouses={filteredWarehouses}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.warehouseType !== 'all' || filters.status !== 'all'}
        onView={handleViewWarehouse}
        onEdit={handleEditWarehouse}
        onDelete={handleDeleteWarehouse}
        onCreateWarehouse={handleCreateWarehouse}
      />

      {/* Dialogs */}
      <WarehouseDialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen} warehouse={selectedWarehouse} warehouses={warehouses} onCreated={refetch} onUpdated={refetch} />
      <WarehouseDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} warehouse={selectedWarehouse} />
    </div>
  );
}
