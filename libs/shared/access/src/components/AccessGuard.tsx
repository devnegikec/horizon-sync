import * as React from 'react';

import { NoPermission } from '@horizon-sync/ui/components';

import { useAccess } from '../hooks/useAccess';
import type { Action } from '../types';

export interface AccessGuardProps {
  /** Module key, e.g. `wms`. */
  module: string;
  /** Resource key, e.g. `manage`. */
  resource: string;
  /** Action to require. Defaults to `view`. */
  action?: Action;
  /**
   * Rendered when access is denied. Defaults to an inline "Access Denied" panel.
   * Pass `null` to render nothing, or `<Navigate to="/" />` to redirect.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * `<AccessGuard>` — gate a section/route behind a resource+action requirement.
 * Complements `PermissionGuard` with resource-level granularity.
 */
export function AccessGuard({ module, resource, action = 'view', fallback, children }: AccessGuardProps) {
  const access = useAccess(module);

  if (access.can(resource, action)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return <NoPermission />;
}
