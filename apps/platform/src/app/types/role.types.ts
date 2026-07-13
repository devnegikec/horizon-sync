// Role Management Types

export interface Permission {
  id: string;
  code: string; // e.g., "item.create"
  name: string; // e.g., "Create Items"
  resource: string; // e.g., "item"
  action: string; // e.g., "create"
  module: string; // e.g., "inventory"
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  is_system: boolean;
  is_active: boolean;
  permissions: Permission[];
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListResponse {
  data: Role[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/** Legacy: permissions grouped by resource key (e.g. { "item": [...], "warehouse": [...] }) */
export interface GroupedPermissions {
  [resource: string]: Permission[];
}

/** New: a resource within a module (e.g. "Items" inside "Inventory") */
export interface ModuleResource {
  key: string;    // e.g. "item"
  label: string;  // e.g. "Items"
  permissions: Permission[];
}

/** New: a top-level ERP module grouping related resources */
export interface ModuleGroup {
  key: string;         // e.g. "inventory"
  label: string;       // e.g. "Inventory"
  description: string;
  icon: string;
  resources: ModuleResource[];
}

export interface PermissionGroupedResponse {
  /** Module-grouped structure for the module-toggle UI */
  modules: ModuleGroup[];
  /** Legacy category-grouped structure (backward compat) */
  categories: Array<{
    name: string;
    icon: string | null;
    module: string | null;
    permissions: Permission[];
  }>;
  uncategorized: Permission[];
  /** Convenience flat map by resource (derived from categories, used by PermissionMatrix) */
  data: GroupedPermissions;
}

export interface RoleFilters {
  search: string;
  isSystem: boolean | null; // null = all, true = system only, false = custom only
  isActive: boolean | null;
  page: number;
  pageSize: number;
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: string[]; // array of permission codes
}

export type DialogMode = 'create' | 'edit' | 'clone' | null;

/** Preloaded role template shown in the role picker */
export interface RoleTemplate {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
}
