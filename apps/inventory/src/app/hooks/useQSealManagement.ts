import * as React from 'react';

import { MOCK_CREDIT_INFO, MOCK_QSEAL_PRODUCTS } from '../data/qseal.mock';
import type { QSealCreditInfo, QSealFilters, QSealProduct } from '../types/qseal.types';
import { useQSealProducts } from './useQSealProducts';

export function useQSealManagement() {
  const [filters, setFilters] = React.useState<QSealFilters>({});
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<QSealProduct | null>(null);
  const [creditInfo] = React.useState<QSealCreditInfo>(MOCK_CREDIT_INFO);

  const { products, pagination, loading, error, refetch, currentPage, setPage } =
    useQSealProducts(1, filters);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status, filters.qr_type, setPage]);

  const handleCreateProduct = React.useCallback(() => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  }, []);

  const handleEditProduct = React.useCallback((product: QSealProduct) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
  }, []);

  const handleViewProduct = React.useCallback((product: QSealProduct) => {
    setSelectedProduct(product);
    setDetailDialogOpen(true);
  }, []);

  const handleSaveProduct = React.useCallback(
    (_product: Partial<QSealProduct>) => {
      // TODO: wire to real API — for now just close and refetch
      setProductDialogOpen(false);
      refetch();
    },
    [refetch],
  );

  const stats = React.useMemo(() => {
    const all = MOCK_QSEAL_PRODUCTS;
    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      totalQRCodes: all.reduce((s, p) => s + p.total_qr_codes, 0),
      totalScans: all.reduce((s, p) => s + p.scan_count, 0),
    };
  }, []);

  const serverPaginationConfig = React.useMemo(() => {
    if (!pagination) return undefined;
    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (page: number) => setPage(page),
    };
  }, [pagination, setPage]);

  return {
    filters,
    setFilters,
    products,
    pagination,
    loading,
    error,
    refetch,
    currentPage,
    stats,
    creditInfo,
    productDialogOpen,
    setProductDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedProduct,
    handleCreateProduct,
    handleEditProduct,
    handleViewProduct,
    handleSaveProduct,
    serverPaginationConfig,
  };
}
