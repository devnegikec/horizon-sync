import * as React from 'react';

import { useQSealManagement } from '../../hooks/useQSealManagement';

import { QSealDetailDialog } from './QSealDetailDialog';
import { QSealFilters } from './QSealFilters';
import { QSealHeader } from './QSealHeader';
import { QSealProductDialog } from './QSealProductDialog';
import { QSealStats } from './QSealStats';
import { QSealTable } from './QSealTable';

export function QSealManagement() {
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
    handleCreateProduct,
    handleEditProduct,
    handleViewProduct,
    handleSaveProduct,
    serverPaginationConfig,
  } = useQSealManagement();

  const hasActiveFilters =
    !!filters.search ||
    (!!filters.status && filters.status !== 'all') ||
    (!!filters.qr_type && filters.qr_type !== 'all');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <QSealHeader
        onRefresh={refetch}
        onCreateProduct={handleCreateProduct}
        isLoading={loading}
        creditInfo={creditInfo}
      />

      <QSealStats
        total={stats.total}
        active={stats.active}
        totalQRCodes={stats.totalQRCodes}
        totalScans={stats.totalScans}
      />

      <QSealFilters filters={filters} setFilters={setFilters} />

      <QSealTable
        products={products}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onView={handleViewProduct}
        onEdit={handleEditProduct}
        onToggleStatus={(p) => {
          // TODO: wire to real API toggle
          console.log('toggle status', p.id);
        }}
        onCreateProduct={handleCreateProduct}
        serverPagination={serverPaginationConfig}
      />

      <QSealDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        product={selectedProduct}
      />

      <QSealProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
