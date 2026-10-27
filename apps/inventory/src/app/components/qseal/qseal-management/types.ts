import type { useQSealManagement } from '../../../hooks/useQSealManagement';

/** Top-level QSeal views shown in `QSealNavigation`. */
export type QSealView = 'products' | 'blocks' | 'sku_customization' | 'analytics' | 'activation' | 'aggregation' | 'product_settings';

/**
 * Products-managment state. The shell owns this hook so the QR-credit summary in
 * `QSealHeader` and the Products actions in `ProductsManagement` share one source
 * of truth, mirroring how `WMSManagement` owns the selected warehouse for
 * `WMSHeader`.
 */
export type QSealManagementState = ReturnType<typeof useQSealManagement>;

/** Shared prop contract every `QSealView` content component receives. */
export interface QSealContentProps {
  activeView: QSealView;
  canViewAnalytics: boolean;
  management: QSealManagementState;
}
