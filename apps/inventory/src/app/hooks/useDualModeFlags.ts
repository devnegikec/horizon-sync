import { useFeatureVisibilities } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import {
    AUTO_APPROVE_SINGLE_CREATE,
    AUTO_CREATE_SKU_ON_ITEM,
    AUTO_CREATE_VARIANT_AXES,
    ITEM_AUTO_CREATE_PRODUCT,
    PRODUCT_EDITABLE_MANUALLY,
    QSEAL_ENABLED,
    REQUIRE_ITEM_APPROVAL,
    VARIANT_STRUCTURED_ENABLED,
    WMS_ENABLED,
} from '../constants/feature-flags';
import { environment } from '../../environments/environment';

const FLAG_API_BASE_URL = `${environment.apiCoreUrl}/api/v1`;

const DUAL_MODE_FLAG_NAMES = [
    WMS_ENABLED,
    QSEAL_ENABLED,
    PRODUCT_EDITABLE_MANUALLY,
    ITEM_AUTO_CREATE_PRODUCT,
    VARIANT_STRUCTURED_ENABLED,
    AUTO_CREATE_SKU_ON_ITEM,
    AUTO_CREATE_VARIANT_AXES,
    REQUIRE_ITEM_APPROVAL,
    AUTO_APPROVE_SINGLE_CREATE,
] as const;

export interface DualModeFlags {
    /** True while any flag is still being evaluated. */
    loading: boolean;
    wmsEnabled: boolean;
    qsealEnabled: boolean;
    productEditableManually: boolean;
    itemAutoCreateProduct: boolean;
    variantStructuredEnabled: boolean;
    autoCreateSkuOnItem: boolean;
    autoCreateVariantAxes: boolean;
    requireItemApproval: boolean;
    autoApproveSingleCreate: boolean;
}

/**
 * Evaluates all Product/Item dual-mode feature flags for the current
 * organization. Deny-by-default: flags resolve to `false` until the
 * core-service explicitly confirms `enabled=true`.
 *
 * Use this to gate UI sections (WMS vs Qseal, approval workflow, etc.).
 */
export function useDualModeFlags(): DualModeFlags {
    const accessToken = useUserStore((s) => s.accessToken);
    const states = useFeatureVisibilities(
        [...DUAL_MODE_FLAG_NAMES],
        FLAG_API_BASE_URL,
        accessToken,
    );

    return {
        loading: DUAL_MODE_FLAG_NAMES.some((name) => states[name]?.loading),
        wmsEnabled: !!states[WMS_ENABLED]?.enabled,
        qsealEnabled: !!states[QSEAL_ENABLED]?.enabled,
        productEditableManually: !!states[PRODUCT_EDITABLE_MANUALLY]?.enabled,
        itemAutoCreateProduct: !!states[ITEM_AUTO_CREATE_PRODUCT]?.enabled,
        variantStructuredEnabled: !!states[VARIANT_STRUCTURED_ENABLED]?.enabled,
        autoCreateSkuOnItem: !!states[AUTO_CREATE_SKU_ON_ITEM]?.enabled,
        autoCreateVariantAxes: !!states[AUTO_CREATE_VARIANT_AXES]?.enabled,
        requireItemApproval: !!states[REQUIRE_ITEM_APPROVAL]?.enabled,
        autoApproveSingleCreate: !!states[AUTO_APPROVE_SINGLE_CREATE]?.enabled,
    };
}
