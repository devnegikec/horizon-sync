/**
 * API Client Barrel Export
 * Re-exports all domain-specific API clients and shared utilities
 */

// Core utilities
export { apiRequest, buildUrl, buildPaginationParams } from './core';
export type { ApiRequestOptions, ApiError } from './core';

// Domain API clients
export { warehouseApi } from './warehouses';
export { stockLevelApi, stockMovementApi, stockEntryApi, stockReconciliationApi } from './stock';
export { customerApi } from './customers';
export { itemSupplierApi } from './suppliers';
export { deliveryNoteApi } from './delivery-notes';
export { quotationApi } from './quotations';
export { salesOrderApi } from './sales-orders';
export { itemApi } from './items';
export { bulkImportApi, bulkExportApi } from './bulk';
export type { BulkExportPayload, BulkExportResponse } from './bulk';
