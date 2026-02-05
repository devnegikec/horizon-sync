import { useState, useEffect, useMemo, useCallback } from 'react';

import type { Table } from '@tanstack/react-table';

import type { ItemFilters, Item } from '../types/item.types';
import type { ApiItem } from '../types/items-api.types';

import { useItemGroups } from './useItemGroups';
import { useItems } from './useItems';

export function useItemManagement() {
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    groupId: 'all',
    status: 'all',
  });

  const { 
    items, 
    pagination, 
    loading, 
    error, 
    refetch, 
    setPage, 
    setPageSize, 
    currentPage, 
    currentPageSize 
  } = useItems(1, 20, filters);
  
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

  const handleCreateItem = useCallback(() => {
    setSelectedItem(null);
    setItemDialogOpen(true);
  }, []);

  const handleEditItem = useCallback((item: ApiItem) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  }, []);

  const handleViewItem = useCallback((item: ApiItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  }, []);

  const handleToggleStatus = useCallback((_item: ApiItem) => {
    // TODO: call API when backend supports status toggle
    refetch();
  }, [refetch]);

  const handleSaveItem = useCallback((_itemData: Partial<Item>) => {
    refetch();
  }, [refetch]);

  const handleTableReady = useCallback((table: Table<ApiItem>) => {
    setTableInstance(table);
  }, []);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: currentPage - 1,
    pageSize: currentPageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    }
  }), [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]);

  return {
    filters,
    setFilters,
    items,
    itemGroups,
    loading,
    error,
    refetch,
    stats,
    itemDialogOpen,
    setItemDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedItem,
    tableInstance,
    handleCreateItem,
    handleEditItem,
    handleViewItem,
    handleToggleStatus,
    handleSaveItem,
    handleTableReady,
    serverPaginationConfig
  };
}
