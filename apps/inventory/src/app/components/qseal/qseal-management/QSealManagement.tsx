import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { ManagementContainer } from '@horizon-sync/ui/components';

import { useQSealManagement } from '../../../hooks/useQSealManagement';
import { hasPermission } from '../../../utils/permissions';

import { QSealContent } from './QSealContent';
import { QSealHeader } from './QSealHeader';
import { QSealNavigation } from './QSealNavigation';
import type { QSealView } from './types';

/**
 * QSeal shell: owns the active view state and the products-management state (so
 * the page header can drive Refresh / New Product / QR credits), then delegates
 * rendering to the view-specific components — `ProductsManagement` in this
 * folder and the remaining views in `../` (QR Blocks, SKU Customization,
 * Analytics, Activation, Aggregation, Settings).
 */
export function QSealManagement() {
  const [activeView, setActiveView] = React.useState<QSealView>('products');
  const user = useUserStore((state) => state.user);
  const userPermissions = useUserStore((state) => state.permissions?.permissions || []);
  const canViewAnalytics = user?.user_type === 'system_admin'
    || user?.user_type === 'organization_admin'
    || hasPermission(userPermissions, 'qr_product.read');
  const management = useQSealManagement();

  // Redirect away from analytics if the user loses access to it
  React.useEffect(() => {
    if (activeView === 'analytics' && !canViewAnalytics) {
      setActiveView('products');
    }
  }, [activeView, canViewAnalytics]);

  return (
    <ManagementContainer>
      <QSealHeader creditInfo={management.creditInfo}/>
      <QSealNavigation activeView={activeView} canViewAnalytics={canViewAnalytics} onViewChange={setActiveView} />
      <QSealContent activeView={activeView}
        canViewAnalytics={canViewAnalytics}
        management={management}/>
    </ManagementContainer>
  );
}
