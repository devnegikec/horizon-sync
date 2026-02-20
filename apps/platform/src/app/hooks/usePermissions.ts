import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { PermissionsService } from '../services/permissions.service';
import { NavigationPermissions, filterNavigationByPermissions, hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

import { useAuth } from './useAuth';

interface PermissionsHookState {
  loading: boolean;
  error: string | null;
}

export function usePermissions() {
  const { user, accessToken, isAuthenticated } = useAuth();
  const { permissions: permissionsData, setPermissions, clearPermissions } = useUserStore();
  const [state, setState] = React.useState<PermissionsHookState>({
    loading: false,
    error: null,
  });

  const fetchPermissions = React.useCallback(async () => {
    if (!isAuthenticated || !user?.organization_id || !accessToken) {
      clearPermissions();
      return;
    }

    setState({ loading: true, error: null });

    try {
      const data = await PermissionsService.getUserPermissions(
        user.organization_id,
        accessToken
      );

      setPermissions({
        permissions: data.permissions,
        roles: data.roles,
        hasAccess: data.has_access,
        lastFetched: new Date(),
      });

      setState({ loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch permissions';
      setState({ loading: false, error: errorMessage });
    }
  }, [isAuthenticated, user?.organization_id, accessToken, setPermissions, clearPermissions]);

  // Fetch permissions when auth state changes
  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Permission checking functions
  const checkPermission = React.useCallback((requiredPermission: string) => {
    return hasPermission(permissionsData.permissions, requiredPermission);
  }, [permissionsData.permissions]);

  const checkAnyPermission = React.useCallback((requiredPermissions: string[]) => {
    return hasAnyPermission(permissionsData.permissions, requiredPermissions);
  }, [permissionsData.permissions]);

  const checkAllPermissions = React.useCallback((requiredPermissions: string[]) => {
    return hasAllPermissions(permissionsData.permissions, requiredPermissions);
  }, [permissionsData.permissions]);

  // Navigation permission helpers
  const canViewUsers = React.useCallback(() => {
    return NavigationPermissions.users.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewRoles = React.useCallback(() => {
    return NavigationPermissions.roles.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewReports = React.useCallback(() => {
    return NavigationPermissions.reports.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewAnalytics = React.useCallback(() => {
    return NavigationPermissions.analytics.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewSettings = React.useCallback(() => {
    return NavigationPermissions.settings.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewInventory = React.useCallback(() => {
    return NavigationPermissions.inventory.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewRevenue = React.useCallback(() => {
    return NavigationPermissions.revenue.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  const canViewSubscriptions = React.useCallback(() => {
    return NavigationPermissions.subscriptions.view(permissionsData.permissions);
  }, [permissionsData.permissions]);

  // Filter navigation items based on permissions
  const filterNavigation = React.useCallback(<T extends { href: string; title: string }>(
    navigationItems: T[]
  ): T[] => {
    return filterNavigationByPermissions(navigationItems, permissionsData.permissions);
  }, [permissionsData.permissions]);

  return {
    // Permissions data from global store
    permissions: permissionsData.permissions,
    roles: permissionsData.roles,
    hasAccess: permissionsData.hasAccess,
    lastFetched: permissionsData.lastFetched,
    
    // Local loading/error state
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchPermissions,
    clearPermissions,

    // Permission checking functions
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,

    // Navigation permission helpers
    canViewUsers,
    canViewRoles,
    canViewReports,
    canViewAnalytics,
    canViewSettings,
    canViewInventory,
    canViewRevenue,
    canViewSubscriptions,

    // Navigation filtering
    filterNavigation,

    // All navigation permissions object for advanced use cases
    NavigationPermissions,
  };
}
