import * as React from 'react';

import { useAccess } from '../hooks/useAccess';
import type { Action } from '../types';

export interface CanProps {
  /** Module key, e.g. `wms`. */
  module: string;
  /** Resource key, e.g. `asn`. */
  resource: string;
  /** Action to check. Defaults to `view`. */
  action?: Action;
  /** Rendered when the user is NOT allowed. Defaults to `null`. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * `<Can>` — render `children` only when the user may perform `action` on `resource`.
 *
 *   <Can module="wms" resource="asn" action="create">
 *     <Button>Register ASN</Button>
 *   </Can>
 */
export function Can({ module, resource, action = 'view', fallback = null, children }: CanProps) {
  const access = useAccess(module);
  return <>{access.can(resource, action) ? children : fallback}</>;
}
