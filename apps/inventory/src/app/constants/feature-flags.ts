/**
 * Feature flag name constants and error codes.
 *
 * Central registry for the inventory app. Add new flag names here
 * instead of using raw strings in components/hooks.
 */

// Feature flag names
export const INVOICES_ENABLED = 'invoices_enabled';

// Product/Item dual-mode (catalog vs WMS)
export const WMS_ENABLED = 'wms_enabled';
export const QSEAL_ENABLED = 'qseal_enabled';
export const PRODUCT_EDITABLE_MANUALLY = 'product_editable_manually';
export const ITEM_AUTO_CREATE_PRODUCT = 'item_auto_create_product';

// Variant handling
export const VARIANT_STRUCTURED_ENABLED = 'variant_structured_enabled';
export const AUTO_CREATE_SKU_ON_ITEM = 'auto_create_sku_on_item';
export const AUTO_CREATE_VARIANT_AXES = 'auto_create_variant_axes';

// Approval workflow
export const REQUIRE_ITEM_APPROVAL = 'require_item_approval';
export const AUTO_APPROVE_SINGLE_CREATE = 'auto_approve_single_create';

// Error codes returned by the backend
export const FEATURE_DISABLED_CODE = 'FEATURE_DISABLED';

// HTTP status for feature-disabled responses
export const HTTP_FEATURE_DISABLED = 423;
