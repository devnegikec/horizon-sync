import * as React from 'react';

import { NoPermission } from '@horizon-sync/ui/components';

import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
  /**
   * A single permission code OR an array of codes (any-match).
   * e.g. "invoice.read"  or  ["invoice.read", "sales_order.read"]
   */
  required: string | string[];
  /**
   * What to render when access is denied.
   * Defaults to an inline "Access Denied" message.
   * Pass <Navigate to="/" /> to redirect instead.
   */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * PermissionGuard — wraps a route or section and blocks rendering
 * when the current user lacks the required permission(s).
 *
 * Usage in AppRoutes:
 *   <Route path="/revenue" element={
 *     <PermissionGuard required="invoice.read">
 *       <RevenuePage />
 *     </PermissionGuard>
 *   } />
 *
 * Usage inside a page:
 *   <PermissionGuard required="invoice.create" fallback={null}>
 *     <Button>Create Invoice</Button>
 *   </PermissionGuard>
 */
export function PermissionGuard({ required, fallback, children }: PermissionGuardProps) {
  const { hasAnyPermission, loading } = usePermissions();

  // While permissions are loading, render nothing to avoid flash
  if (loading) {
    return null;
  }

  const codes = Array.isArray(required) ? required : [required];
  const allowed = hasAnyPermission(codes);

  if (!allowed) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return <NoPermission />;
  }

  return <>{children}</>;
}
