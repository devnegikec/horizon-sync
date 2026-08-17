import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { qrProductApi } from '../api/qr-products';
import type {
  QSealCreditInfo,
  QSealFilters,
  QSealProduct,
  QSealProductListItem,
  CreateQSealProductPayload,
} from '../types/qseal.types';

import { useQSealProducts } from './useQSealProducts';

export function useQSealManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [filters, setFilters] = React.useState<QSealFilters>({});
  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<QSealProduct | null>(null);

  // Credit info — no dedicated endpoint yet, keep as placeholder
  const [creditInfo] = React.useState<QSealCreditInfo | undefined>(undefined);

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

  const handleEditProduct = React.useCallback(
    async (product: QSealProductListItem) => {
      if (!accessToken) return;
      try {
        const full = await qrProductApi.getById(accessToken, product.id);
        setSelectedProduct(full);
        setProductDialogOpen(true);
      } catch {
        // Fallback: open dialog with list-level data mapped to QSealProduct shape
        setSelectedProduct({
          id: product.id,
          organization_id: '',
          name: product.name,
          sku: product.sku ?? product.generic_name,
          generic_name: product.generic_name,
          gtin: product.gtin,
          industry: product.industry,
          qr_type: product.qr_type,
          is_active: product.is_active,
          landing_page: null,
          image_url: null,
          banner_image_url: null,
          email: null,
          phone_number: null,
          client_product_auth_url: null,
          activation_method: 'pre',
          sr_number_type: null,
          redirect_to_client: false,
          warranty_period_months: null,
          extra_data: null,
          created_by: null,
          created_at: product.created_at,
          updated_at: product.created_at,
        });
        setProductDialogOpen(true);
      }
    },
    [accessToken],
  );

  const handleViewProduct = React.useCallback(
    async (product: QSealProductListItem) => {
      if (!accessToken) return;
      try {
        const full = await qrProductApi.getById(accessToken, product.id);
        setSelectedProduct(full);
        setDetailDialogOpen(true);
      } catch {
        setSelectedProduct(null);
        setDetailDialogOpen(true);
      }
    },
    [accessToken],
  );

  const handleSaveProduct = React.useCallback(
    async (data: CreateQSealProductPayload) => {
      if (!accessToken) return;
      try {
        if (selectedProduct) {
          await qrProductApi.update(accessToken, selectedProduct.id, data);
        } else {
          await qrProductApi.create(accessToken, data);
        }
        setProductDialogOpen(false);
        refetch();
      } catch (err) {
        console.error('Failed to save product:', err);
      }
    },
    [accessToken, selectedProduct, refetch],
  );

  const handleToggleStatus = React.useCallback(
    async (product: QSealProductListItem) => {
      if (!accessToken) return;
      try {
        await qrProductApi.update(accessToken, product.id, {
          is_active: !product.is_active,
        });
        refetch();
      } catch (err) {
        console.error('Failed to toggle product status:', err);
      }
    },
    [accessToken, refetch],
  );

  // Stats computed from current page data + pagination totals
  const stats = React.useMemo(() => {
    const total = pagination?.total_items ?? products.length;
    const active = products.filter((p) => p.is_active).length;
    return {
      total,
      active,
      // These aren't available from the list endpoint — show 0 until analytics are integrated
      totalQRCodes: 0,
      totalScans: 0,
    };
  }, [products, pagination]);

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
    handleToggleStatus,
    serverPaginationConfig,
  };
}
