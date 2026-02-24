import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import { Layers, Plus } from 'lucide-react';

import { Button, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import { useItemGroups, useItemGroupMutations } from '../../hooks/useItemGroups';
import type { ItemGroupListItem, ItemGroupFilters } from '../../types/item-group.types';
import { StatCard } from '../shared';

import { ItemGroupDialog } from './ItemGroupDialog';
import { ItemGroupsTable } from './ItemGroupsTable';

export function ItemGroupManagement() {
  const [filters, setFilters] = useState<ItemGroupFilters>({ search: '', status: 'all' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ItemGroupListItem | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<ItemGroupListItem> | null>(null);

  const { itemGroups, pagination, loading, error, refetch, setPage, setPageSize, currentPage, currentPageSize } = useItemGroups(1, 20, filters);
  const { deleteItemGroup } = useItemGroupMutations();

  useEffect(() => { setPage(1); }, [filters, setPage]);

  const stats = useMemo(() => ({
    total: pagination?.total_items ?? 0,
    active: itemGroups.filter((g) => g.is_active).length,
  }), [pagination, itemGroups]);

  const handleCreate = () => { setSelectedGroup(null); setDialogOpen(true); };
  const handleEdit = (group: ItemGroupListItem) => { setSelectedGroup(group); setDialogOpen(true); };

  const handleDelete = async (group: ItemGroupListItem) => {
    if (!window.confirm(`Delete "${group.name}"? This may fail if the group has items.`)) return;
    try {
      await deleteItemGroup(group.id);
      refetch();
    } catch {
      // error surfaced by hook
    }
  };

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: currentPage - 1,
    pageSize: currentPageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    },
  }), [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Groups</h1>
          <p className="text-muted-foreground mt-1">Organize your inventory items into logical categories</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
            New Group
          </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Groups" value={stats.total} icon={Layers} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Groups" value={stats.active} icon={Layers} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-72"
            placeholder="Search by name or code..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
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
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Table */}
      <ItemGroupsTable itemGroups={itemGroups}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all'}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateGroup={handleCreate}
        onTableReady={setTableInstance}
        serverPagination={serverPaginationConfig} />

      {/* Dialog */}
      <ItemGroupDialog open={dialogOpen}
        onOpenChange={setDialogOpen}
        itemGroup={selectedGroup}
        allItemGroups={itemGroups}
        onCreated={refetch}
        onUpdated={refetch} />
    </div>
  );
}
