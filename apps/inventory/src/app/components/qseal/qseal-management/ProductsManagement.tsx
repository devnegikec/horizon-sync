import * as React from 'react';

import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';

import { QSealDetailDialog } from '../QSealDetailDialog';
import { QSealFilters } from '../QSealFilters';
import { QSealProductDialog } from '../QSealProductDialog';
import { QSealStats } from '../QSealStats';
import { QSealTable } from '../QSealTable';

import { ProductsBulkActions } from './ProductsBulkActions';
import type { QSealContentProps } from './types';

interface ProductsHeadingProps {
  loading: boolean;
  onRefresh: () => void;
  onCreateProduct: () => void;
  bulkActions?: React.ReactNode;
}

/** Section heading: title and subtitle on the left, Refresh and New Product on the right. */
function ProductsHeading({ loading, onRefresh, onCreateProduct, bulkActions }: ProductsHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Products</h2>
        <p className="text-sm text-muted-foreground">Manage QR-enabled products and their activation settings.</p>
      </div>
      <div className="flex shrink-0 gap-2 self-start sm:self-auto">
        <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          Refresh
        </Button>
        {bulkActions}
        <Button size="sm" className="gap-2" onClick={onCreateProduct}>
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </div>
    </div>
  );
}

/**
 * Products view. Renders inside the `QSealManagement` shell (page title + view
 * switcher) and owns the Products section heading, stats, filters, table and the
 * product dialogs.
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
      <ProductsHeading loading={loading}
        onRefresh={management.refetch}
        onCreateProduct={handleCreateProduct}
        bulkActions={<ProductsBulkActions filters={filters} onImported={management.refetch} />}/>

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
