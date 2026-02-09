// Role Management Types

export interface Permission {
  id: string;
  code: string; // e.g., "inventory.items.create"
  name: string; // e.g., "Create Inventory Items"
  resource: string; // e.g., "items"
  action: string; // e.g., "create"
  module: string; // e.g., "Inventory"
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

export interface GroupedPermissions {
  [module: string]: Permission[];
}

export interface PermissionGroupedResponse {
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
