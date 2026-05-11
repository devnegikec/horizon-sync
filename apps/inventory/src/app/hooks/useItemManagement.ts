import { useState, useEffect, useMemo, useCallback } from 'react';

import type { Table } from '@tanstack/react-table';
import { useUserStore } from '@horizon-sync/store';

import { itemApi } from '../utility/api/items';
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
  
  const { itemGroups, refetch: refetchItemGroups } = useItemGroups();

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

  const handleEditItem = useCallback(async (item: ApiItem) => {
    // Fetch full item details by ID so all fields are available in the edit form
    const { accessToken } = useUserStore.getState();
    try {
      const fullItem = await itemApi.get(accessToken || '', item.id) as ApiItem;
      setSelectedItem(fullItem);
    } catch {
      // Fall back to list item if fetch fails
      setSelectedItem(item);
    }
    setItemDialogOpen(true);
  }, []);

  const handleViewItem = useCallback((item: ApiItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  }, []);

  const handleToggleStatus = useCallback(async (item: ApiItem) => {
    const { accessToken } = useUserStore.getState();
    try {
      // Fetch full item to get all fields required by the PUT endpoint
      const fullItem = await itemApi.get(accessToken || '', item.id) as ApiItem & {
        item_name?: string;
        description?: string;
        item_group_id?: string;
        item_group?: { id: string; code: string; name: string };
        item_type?: string;
        uom?: string;
        maintain_stock?: boolean;
        valuation_method?: string;
        allow_negative_stock?: boolean;
        has_variants?: boolean;
        variant_of?: string | null;
        variant_attributes?: Record<string, unknown>;
        has_batch_no?: boolean;
        has_serial_no?: boolean;
        batch_number_series?: string;
        serial_number_series?: string;
        standard_rate?: string;
        valuation_rate?: string;
        enable_auto_reorder?: boolean;
        reorder_level?: number;
        reorder_qty?: number;
        min_order_qty?: number;
        max_order_qty?: number;
        weight_per_unit?: string;
        weight_uom?: string;
        inspection_required_before_purchase?: boolean;
        inspection_required_before_delivery?: boolean;
        barcode?: string;
        image_url?: string;
        images?: string[];
        tags?: string[];
        custom_fields?: Record<string, unknown>;
        sales_tax_template_id?: string | null;
        purchase_tax_template_id?: string | null;
        extra_data?: Record<string, unknown>;
      };

      const newStatus = fullItem.status === 'active' ? 'inactive' : 'active';

      await itemApi.update(accessToken || '', item.id, {
        item_code: fullItem.item_code,
        item_name: fullItem.item_name ?? fullItem.item_code,
        description: fullItem.description ?? '',
        item_group_id: fullItem.item_group_id ?? '',
        item_group: fullItem.item_group ?? { id: fullItem.item_group_id ?? '', code: '', name: '' },
        item_type: fullItem.item_type ?? 'stock',
        uom: fullItem.uom ?? 'unit',
        maintain_stock: fullItem.maintain_stock ?? true,
        valuation_method: fullItem.valuation_method ?? 'FIFO',
        allow_negative_stock: fullItem.allow_negative_stock ?? false,
        has_variants: fullItem.has_variants ?? false,
        variant_of: fullItem.variant_of ?? null,
        variant_attributes: fullItem.variant_attributes ?? {},
        has_batch_no: fullItem.has_batch_no ?? false,
        has_serial_no: fullItem.has_serial_no ?? false,
        batch_number_series: fullItem.batch_number_series ?? '',
        serial_number_series: fullItem.serial_number_series ?? '',
        standard_rate: fullItem.standard_rate ?? '0',
        valuation_rate: fullItem.valuation_rate ?? '0',
        enable_auto_reorder: fullItem.enable_auto_reorder ?? false,
        reorder_level: fullItem.reorder_level ?? 0,
        reorder_qty: fullItem.reorder_qty ?? 0,
        min_order_qty: fullItem.min_order_qty ?? 1,
        max_order_qty: fullItem.max_order_qty ?? 0,
        weight_per_unit: fullItem.weight_per_unit ?? '0',
        weight_uom: fullItem.weight_uom ?? '',
        inspection_required_before_purchase: fullItem.inspection_required_before_purchase ?? false,
        inspection_required_before_delivery: fullItem.inspection_required_before_delivery ?? false,
        barcode: fullItem.barcode ?? '',
        status: newStatus,
        image_url: fullItem.image_url ?? '',
        images: fullItem.images ?? [],
        tags: fullItem.tags ?? [],
        custom_fields: fullItem.custom_fields ?? {},
        sales_tax_template_id: fullItem.sales_tax_template_id ?? null,
        purchase_tax_template_id: fullItem.purchase_tax_template_id ?? null,
        extra_data: fullItem.extra_data ?? {},
      });

      refetch();
    } catch (err) {
      console.error('Failed to toggle item status:', err);
    }
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
    refetchItemGroups,
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
