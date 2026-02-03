import * as React from 'react';

import {
  Package,
  Plus,
  Download,
  Boxes,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { SearchInput } from '@horizon-sync/ui/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
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

function itemMatchesSearch(item: ApiItem, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  const name = (item.item_name || '').toLowerCase();
  const code = (item.item_code || '').toLowerCase();
  const groupId = (item.item_group_id || '').toLowerCase();
  return name.includes(s) || code.includes(s) || groupId.includes(s);
}

function itemMatchesFilters(item: ApiItem, filters: ItemFilters): boolean {
  if (!itemMatchesSearch(item, filters.search)) return false;
  if (filters.groupId !== 'all' && (item.item_group_id ?? '') !== filters.groupId) return false;
  if (filters.status !== 'all' && (item.status ?? '') !== filters.status) return false;
  return true;
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
  const { items, pagination, loading, error, refetch } = useItems(1, 20);
  const { itemGroups } = useItemGroups();
  const [filters, setFilters] = React.useState<ItemFilters>({
    search: '',
    groupId: 'all',
    status: 'all',
  });
  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<ApiItem | null>(null);

  const filteredItems = React.useMemo(
    () => items.filter((item) => itemMatchesFilters(item, filters)),
    [items, filters]
  );

  const stats = React.useMemo(() => {
    const totalItems = pagination?.total_items ?? items.length;
    const activeItems = items.filter((i) => i.status === 'active').length;
    return { totalItems, activeItems };
  }, [items, pagination]);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog, pricing, and inventory levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateItem}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Items"
          value={stats.totalItems}
          icon={Package}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title="Active Items"
          value={stats.activeItems}
          icon={Boxes}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Inventory Value"
          value="—"
          icon={DollarSign}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"/>
        <StatCard title="Low Stock Alerts"
          value="—"
          icon={AlertTriangle}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput className="sm:w-80"
          placeholder="Search by code, name, or group..."
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
        <div className="flex gap-3">
          <Select value={filters.groupId}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, groupId: value }))
            }>
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
          <Select value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }>
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

      {/* Items Table */}
      <ItemsTable items={filteredItems}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.groupId !== 'all' || filters.status !== 'all'}
        onView={handleViewItem}
        onEdit={handleEditItem}
        onToggleStatus={handleToggleStatus}
        onCreateItem={handleCreateItem} />

      {/* Dialogs */}
      <ItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} item={selectedItemAsItem} itemGroups={itemGroups} onSave={handleSaveItem} onCreated={refetch} onUpdated={refetch} />
      <ItemDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} item={selectedItemAsItem} />
    </div>
  );
}
