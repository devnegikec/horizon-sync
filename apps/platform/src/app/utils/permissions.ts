/**
 * Permission utility functions for checking user access to various features
 */

export type Permission = string;

/**
 * Check if user has a specific permission.
 * Supports wildcard permissions like "*.*", "user.*" etc.
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  for (const permission of userPermissions) {
    // Super admin wildcard — grants everything
    if (permission === '*.*') {
      return true;
    }

    // Resource wildcard: "user.*" grants "user.read", "user.create", etc.
    if (permission.endsWith('.*')) {
      const prefix = permission.slice(0, -1); // e.g. "user."
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
 * Navigation permission checks.
 *
 * Permission codes match what the identity-service actually issues:
 *   - Identity:    user.*, role.*, org.*
 *   - Sales:       customer.*, sales_order.*, invoice.*
 *   - Procurement: supplier.*, purchase_order.*
 *   - Inventory:   item.*, warehouse.*, stock_entry.*
 *   - Accounting:  chart_of_account.*, payment.*
 */
export const NavigationPermissions = {
  // Users management
  users: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'user.*', 'user.read', 'user.manage']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'user.*', 'user.create', 'user.manage']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'user.*', 'user.update', 'user.manage']),
    delete: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'user.*', 'user.delete', 'user.manage']),
  },

  // Roles management
  roles: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'role.*', 'role.read', 'role.manage']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'role.*', 'role.create', 'role.manage']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'role.*', 'role.update', 'role.manage']),
    delete: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'role.*', 'role.delete', 'role.manage']),
  },

  // Revenue / Sales — maps to invoice + sales_order permissions
  revenue: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'invoice.*', 'invoice.read', 'sales_order.*', 'sales_order.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'invoice.*', 'invoice.create', 'sales_order.*', 'sales_order.create']),
  },

  // Sourcing — maps to purchase_order + supplier permissions
  sourcing: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'purchase_order.*', 'purchase_order.read', 'supplier.*', 'supplier.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'purchase_order.*', 'purchase_order.create', 'supplier.*', 'supplier.create']),
  },

  // Inventory — maps to item permissions
  inventory: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'item.*', 'item.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'item.*', 'item.create']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'item.*', 'item.update']),
    delete: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'item.*', 'item.delete']),
  },

  // WMS — maps to warehouse + pick_list permissions
  wms: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'warehouse.*', 'warehouse.read', 'stock_entry.*', 'stock_entry.read', 'pick_list.*', 'pick_list.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'warehouse.*', 'warehouse.create', 'stock_entry.*', 'stock_entry.create', 'pick_list.*', 'pick_list.create']),
    manage: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'warehouse.*', 'stock_entry.*', 'pick_list.*']),
  },

  // ASN / Advance Stock Notice
  asn: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'asn_order.*', 'asn_order.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'asn_order.*', 'asn_order.create']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'asn_order.*', 'asn_order.update']),
    manage: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'asn_order.*']),
  },

  // Books / Accounting — maps to chart_of_account permissions
  books: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'chart_of_account.*', 'chart_of_account.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'chart_of_account.*', 'chart_of_account.create']),
  },

  // Payments — maps to payment permissions
  payments: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'payment.*', 'payment.read']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'payment.*', 'payment.create']),
  },

  // Reports
  reports: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'report.*', 'report.read', 'report.view']),
  },

  // Analytics
  analytics: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'analytics.*', 'analytics.read']),
  },

  // Settings
  settings: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'settings.*', 'settings.read', 'org.*', 'org.read']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'settings.*', 'settings.update', 'org.*', 'org.update']),
  },

  // Subscriptions
  subscriptions: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'subscription.*', 'subscription.read']),
    manage: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'subscription.*', 'subscription.manage']),
  },

  // Banking
  banking: {
    view: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'banking.*', 'banking.read', 'payment.*', 'payment.read']),
    manage: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'banking.*', 'banking.manage']),
    create: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'banking.*', 'banking.create']),
    update: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'banking.*', 'banking.update']),
    delete: (p: Permission[]) =>
      hasAnyPermission(p, ['*.*', 'banking.*', 'banking.delete']),
  },
};

/**
 * Get filtered navigation items based on user permissions.
 * If organizationId is null/undefined the user hasn't registered an org yet
 * and is treated as the owner — show all navigation items.
 */
export function filterNavigationByPermissions<T extends { href: string; title: string }>(
  navigationItems: T[],
  userPermissions: Permission[],
  organizationId?: string | null
): T[] {
  // User without an organization is the owner of a new org — grant full access
  if (!organizationId) {
    return navigationItems;
  }

  return navigationItems.filter(item => {
    switch (item.href) {
      case '/users':
        return NavigationPermissions.users.view(userPermissions);
      case '/roles':
        return NavigationPermissions.roles.view(userPermissions);
      case '/revenue':
        return NavigationPermissions.revenue.view(userPermissions);
      case '/sourcing':
        return NavigationPermissions.sourcing.view(userPermissions);
      case '/inventory':
        return NavigationPermissions.inventory.view(userPermissions);
      case '/wms':
        return NavigationPermissions.wms.view(userPermissions);
      case '/books':
        return NavigationPermissions.books.view(userPermissions);
      case '/payments':
        return NavigationPermissions.payments.view(userPermissions);
      case '/reports':
        return NavigationPermissions.reports.view(userPermissions);
      case '/analytics':
        return NavigationPermissions.analytics.view(userPermissions);
      case '/settings':
        return NavigationPermissions.settings.view(userPermissions);
      case '/subscriptions':
        return NavigationPermissions.subscriptions.view(userPermissions);
      case '/banking':
        return NavigationPermissions.banking.view(userPermissions);
      // Dashboard, help, and profile are accessible to all authenticated users
      case '/':
      case '/help':
      case '/profile':
      default:
        return true;
    }
  });
}

/**
 * Check if user is a system administrator
 */
export function isSystemAdmin(userPermissions: Permission[]): boolean {
  return hasAnyPermission(userPermissions, ['*.*', 'system.admin', 'role.manage']);
}