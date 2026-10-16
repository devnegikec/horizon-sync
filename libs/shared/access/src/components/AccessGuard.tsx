import * as React from 'react';

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

  return <AccessDenied />;
}

function AccessDenied() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-2xl font-bold text-destructive">
        !
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          You don&apos;t have permission to view this. Contact your administrator to request access.
        </p>
      </div>
    </div>
  );
}
