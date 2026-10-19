import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { BulkImportExport } from '@horizon-sync/ui';
import type {
  BulkExportRequest,
  BulkImportOutcome,
  BulkStatusFilter,
} from '@horizon-sync/ui';

import { qrProductApi } from '../../../api/qr-products';
import type { QSealFilters } from '../../../types/qseal.types';

interface ProductsBulkActionsProps {
  /** Current list filters, reused as defaults when exporting. */
  filters: QSealFilters;
  /** Called after a successful import so the list can be refreshed. */
  onImported?: () => void;
}

function toIsActive(status?: BulkStatusFilter | string): boolean | undefined {
  if (status === 'active') return true;
  if (status === 'inactive') return false;
  return undefined;
}

/**
 * Wires the QR products bulk API into the reusable {@link BulkImportExport}
 * component (export, template download and CSV/Excel import).
 */
export function ProductsBulkActions({ filters, onImported }: ProductsBulkActionsProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const requireToken = React.useCallback((): string => {
    if (!accessToken) {
      throw new Error('Please ensure you are logged in');
    }
    return accessToken;
  }, [accessToken]);

  const handleExport = React.useCallback(
    async ({ format, status }: BulkExportRequest): Promise<Blob> => {
      // The dialog's status wins; fall back to the page's active filter.
      const isActive = toIsActive(status) ?? toIsActive(filters.status);
      return qrProductApi.exportBulk(requireToken(), {
        format: format === 'xlsx' ? 'xlsx' : 'csv',
        is_active: isActive,
        search: filters.search || undefined,
      });
    },
    [filters.search, filters.status, requireToken],
  );

  const handleDownloadTemplate = React.useCallback(
    (format: BulkExportRequest['format']): Promise<Blob> =>
      qrProductApi.downloadImportTemplate(requireToken(), format === 'xlsx' ? 'xlsx' : 'csv'),
    [requireToken],
  );

  const handleImport = React.useCallback(
    async (file: File): Promise<BulkImportOutcome> => {
      const result = await qrProductApi.importBulk(requireToken(), file);
      return {
        totalRows: result.total_rows,
        created: result.created,
        updated: result.updated,
        failed: result.failed,
        errors: result.errors?.map((error) => ({ row: error.row, message: error.message })),
      };
    },
    [requireToken],
  );

  return (
    <BulkImportExport
      triggerLabel="Product Export/Import"
      exportActionLabel="Export Products"
      importActionLabel="Import Products"
      exportTitle="Export Products"
      exportDescription="Download your QR products as a CSV or Excel file. The same file can be edited and re-imported."
      importTitle="Import Products"
      importDescription="Upload a file to create or update QR products. Existing products are matched on SKU."
      defaultExportFileName="qr_products_export"
      templateFileName="qr_products_import_template"
      fileFormats={['csv', 'xlsx']}
      templateFormats={['csv']}
      showStatusFilter
      onExport={handleExport}
      onDownloadTemplate={handleDownloadTemplate}
      onImport={handleImport}
      onImported={onImported}
    />
  );
}
