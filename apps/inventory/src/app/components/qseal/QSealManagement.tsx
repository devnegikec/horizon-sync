import * as React from 'react';

import { useQSealManagement } from '../../hooks/useQSealManagement';
import type { QSealProductListItem } from '../../types/qseal.types';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';

import { QSealDetailDialog } from './QSealDetailDialog';
import { QSealFilters } from './QSealFilters';
import { QSealHeader } from './QSealHeader';
import { QSealProductDialog } from './QSealProductDialog';
import { QSealStats } from './QSealStats';
import { QSealTable } from './QSealTable';

export function QSealManagement({
  onOpenBlocks,
  onOpenAnalytics,
  onOpenAllBlocks,
  onOpenAllAnalytics,
}: {
  onOpenBlocks?: (product: QSealProductListItem) => void;
  onOpenAnalytics?: (product: QSealProductListItem) => void;
  onOpenAllBlocks?: () => void;
  onOpenAllAnalytics?: () => void;
}) {
  const {
    filters,
    setFilters,
    products,
    loading,
    error,
    refetch,
    stats,
    creditInfo,
    productDialogOpen,
    setProductDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedProduct,
    productSaveError,
    clearProductSaveError,
    handleCreateProduct,
    handleEditProduct,
    handleViewProduct,
    handleSaveProduct,
    saving,
    handleToggleStatus: toggleProductStatus,
    serverPaginationConfig,
  } = useQSealManagement();
  const [statusProduct, setStatusProduct] = React.useState<QSealProductListItem | null>(null);
  const [statusUpdating, setStatusUpdating] = React.useState(false);

  const filterByStatus = React.useCallback((status: 'all' | 'active') => {
    setFilters((current) => ({ ...current, status }));
  }, [setFilters]);
  const confirmStatusChange = async () => {
    if (!statusProduct) return;
    setStatusUpdating(true);
    try {
      await toggleProductStatus(statusProduct);
      setStatusProduct(null);
    } finally {
      setStatusUpdating(false);
    }
  };

  const hasActiveFilters = !!filters.search || (!!filters.status && filters.status !== 'all');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <QSealHeader onRefresh={refetch} onCreateProduct={handleCreateProduct} isLoading={loading} creditInfo={creditInfo} />

      <QSealStats
        total={stats.total}
        active={stats.active}
        totalQRCodes={stats.totalQRCodes}
        totalScans={stats.totalScans}
        onFilterStatus={filterByStatus}
        onOpenBlocks={onOpenAllBlocks}
        onOpenAnalytics={onOpenAllAnalytics}
      />

      <QSealFilters filters={filters} setFilters={setFilters} />

      <QSealTable products={products}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onView={handleViewProduct}
        onOpenBlocks={onOpenBlocks}
        onOpenAnalytics={onOpenAnalytics}
        onEdit={handleEditProduct}
        onToggleStatus={setStatusProduct}
        onCreateProduct={handleCreateProduct}
        serverPagination={serverPaginationConfig}/>

      <QSealDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} product={selectedProduct} />

      <QSealProductDialog open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
        saving={saving}
        saveError={productSaveError}
        onClearSaveError={clearProductSaveError}/>

      <ConfirmationDialog
        open={Boolean(statusProduct)}
        onOpenChange={(open) => { if (!open && !statusUpdating) setStatusProduct(null); }}
        title={statusProduct?.is_active ? 'Deactivate product?' : 'Activate product?'}
        description={statusProduct?.is_active
          ? `Deactivating ${statusProduct.name} will hide it from active product workflows. Existing QR data will remain available.`
          : `Activate ${statusProduct?.name || 'this product'} so it can be used in active product workflows.`}
        confirmLabel={statusProduct?.is_active ? 'Deactivate' : 'Activate'}
        variant={statusProduct?.is_active ? 'destructive' : 'default'}
        loading={statusUpdating}
        onConfirm={() => void confirmStatusChange()}
      />
    </div>
  );
}
