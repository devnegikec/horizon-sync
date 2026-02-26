import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { purchaseOrderApi } from '../utility/api';
import type { PurchaseOrderListItem, PurchaseOrderFilters } from '../types/purchase-order.types';

export function usePurchaseOrders(initialFilters: Partial<PurchaseOrderFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<PurchaseOrderFilters>>({
    status: 'all',
    search: '',
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchPurchaseOrders = useCallback(async () => {
    if (!accessToken) {
      setPurchaseOrders([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await purchaseOrderApi.list(accessToken, filters);
      setPurchaseOrders(response.purchase_orders || []);
      setTotalCount(response.pagination?.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Purchase Orders';
      setError(errorMessage);
      console.error('Error fetching Purchase Orders:', err);
      setPurchaseOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const refetch = useCallback(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
