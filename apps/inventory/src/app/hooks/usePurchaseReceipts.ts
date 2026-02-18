import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { purchaseReceiptApi } from '../utility/api';
import type { PurchaseReceiptListItem, PurchaseReceiptFilters } from '../types/purchase-receipt.types';

export function usePurchaseReceipts(initialFilters: Partial<PurchaseReceiptFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [purchaseReceipts, setPurchaseReceipts] = useState<PurchaseReceiptListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<PurchaseReceiptFilters>>({
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchPurchaseReceipts = useCallback(async () => {
    if (!accessToken) {
      setPurchaseReceipts([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await purchaseReceiptApi.list(accessToken, filters);
      setPurchaseReceipts(response.purchase_receipts || []);
      setTotalCount(response.pagination?.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Purchase Receipts';
      setError(errorMessage);
      console.error('Error fetching Purchase Receipts:', err);
      setPurchaseReceipts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchPurchaseReceipts();
  }, [fetchPurchaseReceipts]);

  const refetch = useCallback(() => {
    fetchPurchaseReceipts();
  }, [fetchPurchaseReceipts]);

  return {
    purchaseReceipts,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
