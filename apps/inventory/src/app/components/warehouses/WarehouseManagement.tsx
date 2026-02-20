import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Download,
  Building2,
  Store,
} from 'lucide-react';

import { Card, CardContent, Button, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useWarehouses, useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, WarehouseFilters } from '../../types/warehouse.types';
import { StatCard } from '../shared';

import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { WarehouseDialog } from './WarehouseDialog';
import { WarehousesTable } from './WarehousesTable';

export function WarehouseManagement() {
  const [filters, setFilters] = useState<WarehouseFilters>({
    search: '',
    warehouseType: 'all',
    status: 'all',
  });

  const { warehouses, pagination, statusCounts, typeCounts, loading, error, refetch, setPage, setPageSize, currentPage, currentPageSize } = useWarehouses(1, 20, filters);
  const { deleteWarehouse } = useWarehouseMutations();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<Warehouse> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  // const filteredWarehouses = useMemo(() => {
  //   return warehouses.filter((warehouse) => {
  //     if (filters.search) {
  //       const searchLower = filters.search.toLowerCase();
  //       const matchesSearch =
  //         warehouse.name.toLowerCase().includes(searchLower) ||
  //         warehouse.code.toLowerCase().includes(searchLower) ||
  //         (warehouse.city || '').toLowerCase().includes(searchLower);
  //       if (!matchesSearch) return false;
  //     }

  //     if (filters.warehouseType !== 'all' && warehouse.warehouse_type !== filters.warehouseType) {
  //       return false;
  //     }

  //     if (filters.status !== 'all') {
  //       const isActive = filters.status === 'active';
  //       if (warehouse.is_active !== isActive) return false;
  //     }

  //     return true;
  //   });
  // }, [warehouses, filters]);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const active = statusCounts?.active ?? 0;
    const warehouseCount = typeCounts?.warehouse ?? 0;
    const storeCount = typeCounts?.store ?? 0;
    return { total, active, warehouseCount, storeCount };
  }, [pagination, statusCounts, typeCounts]);

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

  const handleTableReady = (table: Table<Warehouse>) => {
    setTableInstance(table);
  };
  const serverPaginationConfig = useMemo(() => ({
      pageIndex: currentPage - 1, // DataTable uses 0-based indexing
      pageSize: currentPageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1); // Convert back to 1-based for API
        setPageSize(newPageSize);
      }
    }), [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Warehouses Table */}
      <WarehousesTable warehouses={warehouses} loading={loading} error={error} hasActiveFilters={!!filters.search || filters.warehouseType !== 'all' || filters.status !== 'all'} onView={handleViewWarehouse} onEdit={handleEditWarehouse} onDelete={handleDeleteWarehouse} onCreateWarehouse={handleCreateWarehouse} onTableReady={handleTableReady} serverPagination={serverPaginationConfig}/>

      {/* Dialogs */}
      <WarehouseDialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen} warehouse={selectedWarehouse} warehouses={warehouses} onCreated={refetch} onUpdated={refetch} />
      <WarehouseDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} warehouse={selectedWarehouse} />
    </div>
  );
}
