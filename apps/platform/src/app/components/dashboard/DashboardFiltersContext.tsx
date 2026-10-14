import * as React from 'react';

import type { DashboardFilters } from './types';

const DashboardFiltersContext = React.createContext<DashboardFilters | null>(null);

/**
 * Access the section's point-in-time filters from inside a widget instead of
 * threading them through props. Registered widgets already receive them as
 * props; this is handy for components nested below a widget.
 */
export function useDashboardFilters(): DashboardFilters {
  const ctx = React.useContext(DashboardFiltersContext);
  if (!ctx) {
    throw new Error('useDashboardFilters must be used inside <DashboardSection>');
  }
  return ctx;
}

export { DashboardFiltersContext };
