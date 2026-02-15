/**
 * API Utility Helpers
 * 
 * This file re-exports all API clients from modular files in ./api/
 * For new code, prefer importing directly from the specific module:
 *   import { salesOrderApi } from '../utility/api/sales-orders';
 * 
 * This barrel re-export ensures backward compatibility with existing imports.
 */

export {
  // Core utilities
  apiRequest,
  buildUrl,
  buildPaginationParams,

  // Domain API clients
  warehouseApi,
  stockLevelApi,
  stockMovementApi,
  stockEntryApi,
  stockReconciliationApi,
  customerApi,
  itemSupplierApi,
  deliveryNoteApi,
  quotationApi,
  salesOrderApi,
  itemApi,
  bulkImportApi,
  bulkExportApi,
} from './api/index';

export type {
  ApiRequestOptions,
  ApiError,
  BulkExportPayload,
  BulkExportResponse,
} from './api/index';
