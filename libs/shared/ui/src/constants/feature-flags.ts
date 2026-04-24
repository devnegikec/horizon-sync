/**
 * Feature flag name constants and error codes.
 *
 * Shared across all frontend apps (platform, admin, inventory).
 * Add new flag names here instead of using raw strings in components/hooks.
 */

// Feature flag names
export const INVOICES_ENABLED = 'invoices_enabled';
export const INVENTORY_MODULE_ENABLED = 'inventory_module_enabled';

// Error codes returned by the backend
export const FEATURE_DISABLED_CODE = 'FEATURE_DISABLED';

// HTTP status for feature-disabled responses
export const HTTP_FEATURE_DISABLED = 423;
