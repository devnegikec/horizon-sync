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
export { itemSupplierApi, supplierApi } from './suppliers';
export { deliveryNoteApi } from './delivery-notes';
export { quotationApi } from './quotations';
export { salesOrderApi } from './sales-orders';
export { itemApi } from './items';
export { bulkImportApi, bulkExportApi } from './bulk';
export type { BulkExportPayload, BulkExportResponse } from './bulk';

// Sourcing flow APIs
export { rfqApi } from './rfqs';
export { materialRequestApi } from './material-requests';
export { purchaseOrderApi } from './purchase-orders';
export { purchaseReceiptApi } from './purchase-receipts';
export { landedCostApi } from './landed-costs';

// Item Group APIs
export { itemGroupApi } from './item-groups';

// ERP APIs
export { accountApi } from './accounts';

// Payment APIs
export * as paymentApi from './payments';

// Communication APIs
export { communicationApi } from './communications';
