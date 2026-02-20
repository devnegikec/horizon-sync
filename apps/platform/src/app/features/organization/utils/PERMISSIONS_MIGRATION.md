# Organization Permissions - Migration to Global Store

## Overview

The `hasPermission` function in this utility has been updated to use the global Zustand store for permissions instead of checking the user object directly. This provides better consistency and allows permissions to be shared across all apps.

## What Changed

### Before

```typescript
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  // Check user.permissions array
  if (user.permissions?.includes(permission)) return true;

  // Check user.role.permissions array
  if (user.role?.permissions?.includes(permission)) return true;

  return false;
}
```

### After

```typescript
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  // 1. First check global store (preferred)
  const storePermissions = useUserStore.getState().permissions.permissions;
  if (storePermissions.length > 0) {
    return checkPermissionInList(storePermissions, permission);
  }

  // 2. Fallback to user object (backward compatibility)
  return checkUserPermissions(user, permission);
}
```

## Benefits

1. **Single Source of Truth**: Permissions are fetched once and stored globally
2. **Cross-App Consistency**: All apps (platform, inventory) use the same permissions
3. **Better Performance**: No need to pass user object around just for permission checks
4. **Backward Compatible**: Still works with user object as fallback

## Usage

### Current Usage (Still Works)

```typescript
import { hasPermission } from '../utils/permissions';
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'organization.update');

  return canEdit ? <EditButton /> : null;
}
```

### New Recommended Usage

```typescript
import { hasPermissionFromStore } from '../utils/permissions';

function MyComponent() {
  const canEdit = hasPermissionFromStore('organization.update');

  return canEdit ? <EditButton /> : null;
}
```

## Migration Guide

### No Changes Required

Your existing code will continue to work without any changes. The function automatically uses the global store when available.

### Optional: Simplify Your Code

If you want to simplify your code, you can use the new `hasPermissionFromStore` function:

**Before:**

```typescript
const { user } = useAuth();
const canEdit = hasPermission(user, 'organization.update');
```

**After:**

```typescript
const canEdit = hasPermissionFromStore('organization.update');
```

## How It Works

1. **Platform app** fetches permissions using `usePermissions()` hook on login
2. Permissions are stored in **global Zustand store** at `store.permissions.permissions`
3. `hasPermission()` checks the store first, then falls back to user object
4. All apps can access the same permissions without additional API calls

## Testing

The function includes a fallback mechanism for testing environments where the store might not be available:

```typescript
function getStorePermissions(): string[] {
  try {
    const storeState = useUserStore.getState();
    return storeState.permissions.permissions;
  } catch {
    // If store is not available (e.g., in tests), return empty array
    return [];
  }
}
```

## Related Files

- **Store Types**: `libs/shared/store/src/user-store.types.ts`
- **Store Implementation**: `libs/shared/store/src/user-store.ts`
- **Permissions Hook**: `apps/platform/src/app/hooks/usePermissions.ts`
- **Usage Guide**: `libs/shared/store/PERMISSIONS_USAGE.md`

## Wildcard Support

The function continues to support wildcard permissions:

- `*.*` - Super admin (access to everything)
- `organization.*` - All organization permissions
- `organization.update` - Specific permission

## Example: Settings Page

The settings page uses this function to check if the user can edit organization settings:

```typescript
// apps/platform/src/app/pages/settings.tsx
const { user } = useAuth();
const canEdit = hasPermission(user, 'organization.update');

return (
  <div>
    <OrganizationSettings canEdit={canEdit} />
    <CurrencySettings canEdit={canEdit} />
  </div>
);
```

This automatically uses the global store permissions, ensuring consistency across the entire application.
