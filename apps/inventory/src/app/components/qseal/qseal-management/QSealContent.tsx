import * as React from 'react';

import { AggregationManagement } from '../AggregationManagement';
import { AnalyticsManagement } from '../AnalyticsManagement';
import { BlocksManagement } from '../BlocksManagement';
import { ProductSettingsManagement } from '../ProductSettingsManagement';
import { QSealActivationManagement } from '../QSealActivationManagement';
import { SkuCustomizationManagement } from '../SkuCustomizationManagement';

import { ProductsManagement } from './ProductsManagement';
import type { QSealContentProps, QSealView } from './types';

/** Analytics is the only permission-gated view. */
function AnalyticsContent({ canViewAnalytics }: QSealContentProps) {
  return canViewAnalytics ? <AnalyticsManagement /> : null;
}

const qsealViewComponents: Record<QSealView, React.ComponentType<QSealContentProps>> = {
  products: ProductsManagement,
  blocks: BlocksManagement,
  sku_customization: SkuCustomizationManagement,
  analytics: AnalyticsContent,
  activation: QSealActivationManagement,
  aggregation: AggregationManagement,
  product_settings: ProductSettingsManagement,
};

/** Renders the content for the active top-level QSeal view. */
export function QSealContent({ activeView, ...props }: QSealContentProps) {
  const Content = qsealViewComponents[activeView];
  return <Content activeView={activeView} {...props} />;
}
