import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { qrProductApi } from '../api/qr-products';
import type { QSealProductListItem, QSealFilters, QSealProductListResponse } from '../types/qseal.types';

const PAGE_SIZE = 20;

export interface UseQSealProductsResult {
  products: QSealProductListItem[];
  pagination: QSealProductListResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  currentPage: number;
  setPage: (page: number) => void;
}

export function useQSealProducts(
  initialPage = 1,
  filters?: QSealFilters,
): UseQSealProductsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [products, setProducts] = React.useState<QSealProductListItem[]>([]);
  const [pagination, setPagination] = React.useState<QSealProductListResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  const fetchProducts = React.useCallback(async () => {
    if (!accessToken) {
      setProducts([]);
      setPagination(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Map UI status filter to API is_active boolean
      let isActive: boolean | undefined;
      if (filters?.status === 'active') isActive = true;
      else if (filters?.status === 'inactive') isActive = false;
      // 'all' or undefined → don't filter

      const data = await qrProductApi.list(accessToken, currentPage, PAGE_SIZE, {
        search: filters?.search || undefined,
        is_active: isActive,
      });

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load QSeal products');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, filters?.search, filters?.status]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    refetch: fetchProducts,
    currentPage,
    setPage: setCurrentPage,
  };
}
