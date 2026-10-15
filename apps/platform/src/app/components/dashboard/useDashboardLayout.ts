import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { dashboardLayoutService } from '../../features/organization/services/dashboardLayoutService';

/** Lookup shape the dashboard needs from the saved org layout. */
export interface DashboardLayoutLookup {
  enabledIds: Set<string>;
  orders: Map<string, number>;
}

/**
 * Fetches the organization's saved dashboard layout (Settings → Dashboard
 * Layout) so the dashboard can honour the enabled/order overrides.
 *
 * Returns `null` while loading and on any failure (endpoint unavailable, no
 * permission, no organization), which makes the caller render the full
 * registry — i.e. the dashboard never breaks because the layout can't load.
 */
export function useDashboardLayout(organizationId: string | null | undefined): DashboardLayoutLookup | null {
  const accessToken = useUserStore((s) => s.accessToken);
  const [layout, setLayout] = React.useState<DashboardLayoutLookup | null>(null);

  React.useEffect(() => {
    if (!accessToken || !organizationId) {
      setLayout(null);
      return;
    }
    let cancelled = false;
    dashboardLayoutService
      .get(accessToken, organizationId)
      .then((data) => {
        if (!cancelled) {
          setLayout({
            enabledIds: new Set(data.enabled_widget_ids),
            orders: new Map(data.widgets.map((widget) => [widget.id, widget.order])),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLayout(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, organizationId]);

  return layout;
}
