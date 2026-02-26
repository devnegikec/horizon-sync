import { useState, useEffect, useMemo, useCallback } from 'react';

import type { Table } from '@tanstack/react-table';

import type { ItemGroupFilters, ItemGroupListItem } from '../types/item-group.types';
import { useItemGroups, useItemGroupMutations } from './useItemGroups';

export function useItemGroupManagement() {
  const [filters, setFilters] = useState<ItemGroupFilters>({
    search: '',
    status: 'all',
  });

  const {
    itemGroups,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useItemGroups(1, 20, filters);

  const { deleteItemGroup } = useItemGroupMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ItemGroupListItem | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<ItemGroupListItem> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const stats = useMemo(() => ({
    total: pagination?.total_items ?? 0,
    active: itemGroups.filter((g) => g.is_active).length,
  }), [pagination, itemGroups]);

  const handleCreate = useCallback(() => {
    setSelectedGroup(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((group: ItemGroupListItem) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  }, []);

  const handleView = useCallback((group: ItemGroupListItem) => {
    setSelectedGroup(group);
    setDetailDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (group: ItemGroupListItem) => {
    if (!window.confirm(`Delete "${group.name}"? This may fail if the group has items.`)) return;
    try {
      await deleteItemGroup(group.id);
      refetch();
    } catch {
      // error surfaced by hook or toast
    }
  }, [deleteItemGroup, refetch]);

  const handleTableReady = useCallback((table: Table<ItemGroupListItem>) => {
    setTableInstance(table);
  }, []);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: currentPage - 1,
    pageSize: currentPageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    },
  }), [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]);

  return {
    filters,
    setFilters,
    itemGroups,
    loading,
    error,
    refetch,
    stats,
    dialogOpen,
    setDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedGroup,
    tableInstance,
    handleCreate,
    handleEdit,
    handleView,
    handleDelete,
    handleTableReady,
    serverPaginationConfig,
  };
}
