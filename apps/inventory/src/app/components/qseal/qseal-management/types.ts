import type { useQSealManagement } from '../../../hooks/useQSealManagement';

/** Top-level QSeal views shown in `QSealNavigation`. */
export type QSealView = 'products' | 'blocks' | 'sku_customization' | 'analytics' | 'activation' | 'aggregation' | 'product_settings';

/**
 * Products-managment state. The shell owns this hook (rather than the Products
 * view) so the page-level header can drive Refresh / New Product / the QR-credit
 * summary, mirroring how `WMSManagement` owns the selected warehouse for
 * `WMSHeader`.
 */
export type QSealManagementState = ReturnType<typeof useQSealManagement>;

/** Shared prop contract every `QSealView` content component receives. */
export interface QSealContentProps {
  activeView: QSealView;
  canViewAnalytics: boolean;
  management: QSealManagementState;
}
