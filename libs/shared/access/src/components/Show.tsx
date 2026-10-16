import * as React from 'react';

import { useAccess } from '../hooks/useAccess';

export interface ShowProps {
  /** Module key, e.g. `wms`. */
  module: string;
  /** Resource key, e.g. `manage`. */
  resource: string;
  /** Rendered when the resource is NOT visible. Defaults to `null`. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * `<Show>` — render `children` when the resource is visible to the user
 * (i.e. the user can perform at least one action on it, typically `view`).
 *
 *   <Show module="wms" resource="manage">
 *     <ManageTab />
 *   </Show>
 */
export function Show({ module, resource, fallback = null, children }: ShowProps) {
  const access = useAccess(module);
  return <>{access.visible(resource) ? children : fallback}</>;
}
