/**
 * Permission utility functions for checking user access to various features
 */

export type Permission = string;

/**
 * Check if user has a specific permission
 * Supports wildcard permissions like "*.*", "user.*" etc.
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Check for exact match first
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  for (const permission of userPermissions) {
    if (permission === '*.*') {
      // Super admin permission - has access to everything
      return true;
    }

    if (permission.endsWith('*')) {
      // Check if permission starts with the required permission prefix
      const prefix = permission.slice(0, -1); // Remove the '*'
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * Navigation permission checks
 */
export const NavigationPermissions = {
  // Users management
  users: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'user.*', 'user.read', 'user.manage']),
    create: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'user.*', 'user.create', 'user.manage']),
    update: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'user.*', 'user.update', 'user.manage']),
    delete: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'user.*', 'user.delete', 'user.manage']),
  },

  // Roles management
  roles: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'role.*', 'role.read', 'role.manage']),
    create: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'role.*', 'role.create', 'role.manage']),
    update: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'role.*', 'role.update', 'role.manage']),
    delete: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'role.*', 'role.delete', 'role.manage']),
  },

  // Reports
  reports: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'report.*', 'report.read', 'report.view']),
    generate: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'report.*', 'report.generate']),
  },

  // Analytics
  analytics: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'analytics.*', 'analytics.read', 'analytics.view']),
  },

  // Settings
  settings: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'settings.*', 'settings.read', 'settings.view']),
    update: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'settings.*', 'settings.update', 'settings.manage']),
  },

  // Inventory
  inventory: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'inventory.*', 'inventory.read', 'inventory.view']),
    create: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'inventory.*', 'inventory.create']),
    update: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'inventory.*', 'inventory.update']),
    delete: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'inventory.*', 'inventory.delete']),
  },

  // Revenue
  revenue: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'revenue.*', 'revenue.read', 'revenue.view']),
  },

  // Subscriptions
  subscriptions: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'subscription.*', 'subscription.read', 'subscription.view']),
    manage: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'subscription.*', 'subscription.manage']),
  },

  // Banking
  banking: {
    view: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'banking.*', 'banking.read', 'banking.view']),
    manage: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'banking.*', 'banking.manage']),
    create: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'banking.*', 'banking.create']),
    update: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'banking.*', 'banking.update']),
    delete: (userPermissions: Permission[]) => 
      hasAnyPermission(userPermissions, ['*.*', 'banking.*', 'banking.delete']),
  },
};

/**
 * Get filtered navigation items based on user permissions
 */
export function filterNavigationByPermissions<T extends { href: string; title: string }>(
  navigationItems: T[],
  userPermissions: Permission[]
): T[] {
  return navigationItems.filter(item => {
    switch (item.href) {
      case '/users':
        return NavigationPermissions.users.view(userPermissions);
      case '/roles':
        return NavigationPermissions.roles.view(userPermissions);
      case '/reports':
        return NavigationPermissions.reports.view(userPermissions);
      case '/analytics':
        return NavigationPermissions.analytics.view(userPermissions);
      case '/settings':
        return NavigationPermissions.settings.view(userPermissions);
      case '/inventory':
        return NavigationPermissions.inventory.view(userPermissions);
      case '/revenue':
        return NavigationPermissions.revenue.view(userPermissions);
      case '/subscriptions':
        return NavigationPermissions.subscriptions.view(userPermissions);
      case '/banking':
        return NavigationPermissions.banking.view(userPermissions);
      // Dashboard, help, and profile are typically accessible to all authenticated users
      case '/':
      case '/help':
      case '/profile':
      case '/sourcing':
      case '/books':
      default:
        return true;
    }
  });
}