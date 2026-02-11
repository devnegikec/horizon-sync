import * as React from 'react';

import { PermissionsService } from '../services/permissions.service';
import { Permission, NavigationPermissions, filterNavigationByPermissions, hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions';

import { useAuth } from './useAuth';

interface PermissionsState {
  permissions: Permission[];
  roles: string[];
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const initialState: PermissionsState = {
  permissions: [],
  roles: [],
  hasAccess: false,
  loading: false,
  error: null,
  lastFetched: null,
};

export function usePermissions() {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [state, setState] = React.useState<PermissionsState>(initialState);

  const fetchPermissions = React.useCallback(async () => {
    if (!isAuthenticated || !user?.organization_id || !accessToken) {
      setState(initialState);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permissionsData = await PermissionsService.getUserPermissions(
        user.organization_id,
        accessToken
      );

      setState({
        permissions: permissionsData.permissions,
        roles: permissionsData.roles,
        hasAccess: permissionsData.has_access,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch permissions';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [isAuthenticated, user?.organization_id, accessToken]);

  // Fetch permissions when auth state changes
  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const clearPermissions = React.useCallback(() => {
    setState(initialState);
  }, []);

  // Permission checking functions
  const checkPermission = React.useCallback((requiredPermission: string) => {
    return hasPermission(state.permissions, requiredPermission);
  }, [state.permissions]);

  const checkAnyPermission = React.useCallback((requiredPermissions: string[]) => {
    return hasAnyPermission(state.permissions, requiredPermissions);
  }, [state.permissions]);

  const checkAllPermissions = React.useCallback((requiredPermissions: string[]) => {
    return hasAllPermissions(state.permissions, requiredPermissions);
  }, [state.permissions]);

  // Navigation permission helpers
  const canViewUsers = React.useCallback(() => {
    return NavigationPermissions.users.view(state.permissions);
  }, [state.permissions]);

  const canViewRoles = React.useCallback(() => {
    return NavigationPermissions.roles.view(state.permissions);
  }, [state.permissions]);

  const canViewReports = React.useCallback(() => {
    return NavigationPermissions.reports.view(state.permissions);
  }, [state.permissions]);

  const canViewAnalytics = React.useCallback(() => {
    return NavigationPermissions.analytics.view(state.permissions);
  }, [state.permissions]);

  const canViewSettings = React.useCallback(() => {
    return NavigationPermissions.settings.view(state.permissions);
  }, [state.permissions]);

  const canViewInventory = React.useCallback(() => {
    return NavigationPermissions.inventory.view(state.permissions);
  }, [state.permissions]);

  const canViewRevenue = React.useCallback(() => {
    return NavigationPermissions.revenue.view(state.permissions);
  }, [state.permissions]);

  const canViewSubscriptions = React.useCallback(() => {
    return NavigationPermissions.subscriptions.view(state.permissions);
  }, [state.permissions]);

  // Filter navigation items based on permissions
  const filterNavigation = React.useCallback(<T extends { href: string; title: string }>(
    navigationItems: T[]
  ): T[] => {
    return filterNavigationByPermissions(navigationItems, state.permissions);
  }, [state.permissions]);

  return {
    ...state,
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
