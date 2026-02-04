import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import { Package, Plus, Download, Boxes, DollarSign, AlertTriangle } from 'lucide-react';

import { DataTableViewOptions } from '@horizon-sync/ui/components/data-table/DataTableViewOptions';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib';

import { useItemGroups } from '../../hooks/useItemGroups';
import { useItems } from '../../hooks/useItems';
import type { Item, ItemFilters } from '../../types/item.types';
import type { ApiItem } from '../../types/items-api.types';

import { ItemDetailDialog } from './ItemDetailDialog';
import { ItemDialog } from './ItemDialog';
import { ItemsTable } from './ItemsTable';

function apiItemToItem(api: ApiItem): Item {
  return {
    id: api.id,
    itemCode: api.item_code,
    name: api.item_name,
    description: '',
    unitOfMeasure: api.uom ?? '',
    defaultPrice: api.standard_rate != null ? parseFloat(api.standard_rate) : 0,
    itemGroupId: api.item_group_id ?? '',
    itemGroupName: api.item_group_name ?? '',
    currentStock: 0,
    status: (api.status === 'active' || api.status === 'inactive' ? api.status : 'active') as Item['status'],
    createdAt: api.created_at ?? '',
    updatedAt: '',
  };
}

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

export function ItemManagement() {
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    groupId: 'all',
    status: 'all',
  });
  
  // Use server-side pagination and filtering
  const { items, pagination, loading, error, refetch, setPage, setPageSize, currentPage, currentPageSize } = useItems(1, 20, filters);
  const { itemGroups } = useItemGroups();
  
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApiItem | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<ApiItem> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const stats = useMemo(() => {
    const totalItems = pagination?.total_items ?? 0;
    const activeItems = pagination?.total_items ?? 0; // API should provide this separately
    return { totalItems, activeItems };
  }, [pagination]);

  const handleCreateItem = () => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ApiItem) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleViewItem = (item: ApiItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const handleToggleStatus = (_item: ApiItem) => {
    // TODO: call API when backend supports status toggle
    refetch();
  };

  const handleSaveItem = (_itemData: Partial<Item>) => {
    refetch();
  };

  const selectedItemAsItem = selectedItem ? apiItemToItem(selectedItem) : null;

  // Use table instance callback
  const handleTableReady = (table: Table<ApiItem>) => {
    setTableInstance(table);
  };

  // Memoize server pagination config to prevent unnecessary re-renders
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
          <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog, pricing, and inventory levels</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateItem} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Items" value={stats.totalItems} icon={Package} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Items" value={stats.activeItems} icon={Boxes} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Inventory Value" value="—" icon={DollarSign} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard title="Low Stock Alerts" value="—" icon={AlertTriangle} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80" placeholder="Search by code, name, or group..." onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
          <div className="flex gap-3">
            <Select value={filters.groupId} onValueChange={(value) => setFilters((prev) => ({ ...prev, groupId: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {itemGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
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

      {/* Items Table */}
      <ItemsTable items={items} 
        loading={loading} 
        error={error} 
        hasActiveFilters={!!filters.search || filters.groupId !== 'all' || filters.status !== 'all'} 
        onView={handleViewItem} 
        onEdit={handleEditItem} 
        onToggleStatus={handleToggleStatus} 
        onCreateItem={handleCreateItem} 
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Dialogs */}
      <ItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} item={selectedItemAsItem} itemGroups={itemGroups} onSave={handleSaveItem} onCreated={refetch} onUpdated={refetch} />
      <ItemDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} item={selectedItemAsItem} />
    </div>
  );
}
