# Using Permissions Across Apps

The permissions system is now stored in the global Zustand store (`@horizon-sync/store`), making it accessible from both the `platform` and `inventory` apps.

## Architecture

Permissions are fetched once in the `platform` app and stored in the shared store. Any app can then access these permissions without making additional API calls.

## Store Structure

```typescript
interface PermissionsData {
  permissions: string[]; // Array of permission strings
  roles: string[]; // Array of role names
  hasAccess: boolean; // Whether user has access
  lastFetched: Date | null; // When permissions were last fetched
}
```

## Usage in Platform App

The `platform` app uses the `usePermissions` hook which automatically fetches and stores permissions:

```typescript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const {
    permissions,
    hasPermission,
    canViewUsers,
    loading,
    error
  } = usePermissions();

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {hasPermission('user.create') && <CreateUserButton />}
      {canViewUsers() && <UsersList />}
    </div>
  );
}
```

## Usage in Inventory App (or any other app)

The `inventory` app can directly access permissions from the store without fetching:

### Option 1: Direct Store Access

```typescript
import { useUserStore } from '@horizon-sync/store';

function InventoryComponent() {
  const { permissions } = useUserStore();

  // Access permissions data
  const canCreateItem = permissions.permissions.includes('inventory.create');
  const hasInventoryAccess = permissions.hasAccess;

  return (
    <div>
      {canCreateItem && <CreateItemButton />}
      {!hasInventoryAccess && <AccessDeniedMessage />}
    </div>
  );
}
```

### Option 2: Create a Custom Hook in Inventory

Create `apps/inventory/src/hooks/useInventoryPermissions.ts`:

```typescript
import { useUserStore } from '@horizon-sync/store';
import { useCallback } from 'react';

export function useInventoryPermissions() {
  const { permissions } = useUserStore();

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.permissions.includes(permission);
    },
    [permissions.permissions],
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]) => {
      return requiredPermissions.some((p) => permissions.permissions.includes(p));
    },
    [permissions.permissions],
  );

  // Inventory-specific permission checks
  const canViewInventory = useCallback(() => {
    return hasAnyPermission(['*.*', 'inventory.*', 'inventory.read', 'inventory.view']);
  }, [hasAnyPermission]);

  const canCreateInventory = useCallback(() => {
    return hasAnyPermission(['*.*', 'inventory.*', 'inventory.create']);
  }, [hasAnyPermission]);

  const canUpdateInventory = useCallback(() => {
    return hasAnyPermission(['*.*', 'inventory.*', 'inventory.update']);
  }, [hasAnyPermission]);

  const canDeleteInventory = useCallback(() => {
    return hasAnyPermission(['*.*', 'inventory.*', 'inventory.delete']);
  }, [hasAnyPermission]);

  return {
    permissions: permissions.permissions,
    roles: permissions.roles,
    hasAccess: permissions.hasAccess,
    lastFetched: permissions.lastFetched,
    hasPermission,
    hasAnyPermission,
    canViewInventory,
    canCreateInventory,
    canUpdateInventory,
    canDeleteInventory,
  };
}
```

Then use it in your components:

```typescript
import { useInventoryPermissions } from '../hooks/useInventoryPermissions';

function InventoryPage() {
  const {
    canViewInventory,
    canCreateInventory,
    hasAccess
  } = useInventoryPermissions();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div>
      {canViewInventory() && <InventoryList />}
      {canCreateInventory() && <CreateInventoryButton />}
    </div>
  );
}
```

## Permission String Format

Permissions follow a hierarchical format:

- `*.*` - Super admin (access to everything)
- `inventory.*` - All inventory permissions
- `inventory.read` - Read inventory
- `inventory.create` - Create inventory items
- `inventory.update` - Update inventory items
- `inventory.delete` - Delete inventory items

## Wildcard Support

The permission system supports wildcards:

- `*.*` matches everything
- `inventory.*` matches all inventory permissions
- `user.*` matches all user permissions

## Best Practices

1. **Fetch Once**: Permissions are fetched once in the platform app when the user logs in
2. **Read Anywhere**: Any app can read permissions from the store without additional API calls
3. **Check Before Render**: Always check permissions before rendering sensitive UI elements
4. **Handle Missing Permissions**: Gracefully handle cases where permissions haven't been loaded yet
5. **Clear on Logout**: Permissions are automatically cleared when `clearAuth()` is called

## Example: Conditional Rendering

```typescript
import { useUserStore } from '@horizon-sync/store';

function ConditionalFeature() {
  const { permissions } = useUserStore();

  const hasFeatureAccess = permissions.permissions.includes('feature.access');

  if (!hasFeatureAccess) {
    return null; // Don't render anything
  }

  return <FeatureComponent />;
}
```

## Example: Route Protection

```typescript
import { useUserStore } from '@horizon-sync/store';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredPermission }) {
  const { permissions } = useUserStore();

  const hasPermission = permissions.permissions.includes(requiredPermission);

  if (!hasPermission) {
    return <Navigate to="/access-denied" />;
  }

  return children;
}

// Usage
<ProtectedRoute requiredPermission="inventory.view">
  <InventoryPage />
</ProtectedRoute>
```

## Debugging

To check current permissions in the browser console:

```javascript
// Get the store state
const state = window.__ZUSTAND_DEVTOOLS_STORE__.getState();
console.log('Permissions:', state.permissions);
```

Or use the Zustand DevTools browser extension for a better debugging experience.
