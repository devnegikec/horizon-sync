import * as React from 'react';

import { ShieldOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';

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
  const { hasPermission, hasAnyPermission, loading } = usePermissions();

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
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}

function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOff className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          You don&apos;t have permission to view this page. Contact your administrator to request access.
        </p>
      </div>
    </div>
  );
}
