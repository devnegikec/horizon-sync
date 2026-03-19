import * as React from 'react';

import { MOCK_QSEAL_PRODUCTS } from '../data/qseal.mock';
import type { QSealProduct, QSealFilters, QSealProductListResponse } from '../types/qseal.types';

const PAGE_SIZE = 20;

export interface UseQSealProductsResult {
  products: QSealProduct[];
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
  const [products, setProducts] = React.useState<QSealProduct[]>([]);
  const [pagination, setPagination] = React.useState<QSealProductListResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);

  const fetchProducts = React.useCallback(() => {
    setLoading(true);
    setError(null);

    // Simulate async fetch with mock data
    setTimeout(() => {
      try {
        let filtered = [...MOCK_QSEAL_PRODUCTS];

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.product_name.toLowerCase().includes(q) ||
              p.product_code.toLowerCase().includes(q) ||
              (p.category ?? '').toLowerCase().includes(q),
          );
        }
        if (filters?.status && filters.status !== 'all') {
          filtered = filtered.filter((p) => p.status === filters.status);
        }
        if (filters?.qr_type && filters.qr_type !== 'all') {
          filtered = filtered.filter((p) => p.qr_type === filters.qr_type);
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
        const page = Math.min(currentPage, totalPages);
        const start = (page - 1) * PAGE_SIZE;
        const paged = filtered.slice(start, start + PAGE_SIZE);

        setProducts(paged);
        setPagination({
          page,
          page_size: PAGE_SIZE,
          total_items: totalItems,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        });
      } catch {
        setError('Failed to load QSeal products');
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [currentPage, filters?.search, filters?.status, filters?.qr_type]);

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
