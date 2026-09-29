import * as React from 'react';

import { QSealDetailDialog } from '../QSealDetailDialog';
import { QSealFilters } from '../QSealFilters';
import { QSealProductDialog } from '../QSealProductDialog';
import { QSealStats } from '../QSealStats';
import { QSealTable } from '../QSealTable';

import type { QSealContentProps } from './types';

/**
 * Products view. Renders inside the `QSealManagement` shell, which owns the page
 * header (title, QR credits, Refresh, New Product) and the view switcher, so this
 * component only renders the products list itself.
 */
export function ProductsManagement({ management }: QSealContentProps) {
  const {
    filters,
    setFilters,
    products,
    loading,
    error,
    stats,
    productDialogOpen,
    setProductDialogOpen,
    detailDialogOpen,
    setDetailDialogOpen,
    selectedProduct,
    handleCreateProduct,
    handleEditProduct,
    handleViewProduct,
    handleSaveProduct,
    saving,
    handleToggleStatus,
    serverPaginationConfig,
  } = management;

  const hasActiveFilters = !!filters.search || (!!filters.status && filters.status !== 'all');

  return (
    <div className="space-y-6">
      <QSealStats total={stats.total} active={stats.active} totalQRCodes={stats.totalQRCodes} totalScans={stats.totalScans} />

      <QSealFilters filters={filters} setFilters={setFilters} />

      <QSealTable products={products}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onView={handleViewProduct}
        onEdit={handleEditProduct}
        onToggleStatus={handleToggleStatus}
        onCreateProduct={handleCreateProduct}
        serverPagination={serverPaginationConfig}/>

      <QSealDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} product={selectedProduct} />

      <QSealProductDialog open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
        saving={saving}/>
    </div>
  );
}
