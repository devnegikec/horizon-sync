import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_IDENTITY_URL = environment.apiIdentityUrl;

export interface RolePermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  resource?: string;
  action?: string;
  module?: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  permissions: RolePermission[];
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleFormData {
  name: string;
  description?: string;
  permissions: string[]; // array of permission codes (same as platform)
}

/** Grouped permissions response from the identity service */
export interface GroupedPermissionCategory {
  name: string;
  permissions: RolePermission[];
}

export interface GroupedPermissionsResponse {
  categories: GroupedPermissionCategory[];
}

/** Flat map of category name → permissions for UI consumption */
export type GroupedPermissions = Record<string, RolePermission[]>;

/** Backward-compatible alias used by UsersPage */
export type SystemAdminRole = Role;

export class AdminRoleService {
  private static getHeaders(): Record<string, string> {
    const token = useUserStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Convert permission codes to permission IDs.
   * Same pattern as platform RoleService.getPermissionIds().
   */
  private static async getPermissionIds(codes: string[]): Promise<string[]> {
    const grouped = await this.listGroupedPermissions();
    const codeToIdMap: Record<string, string> = {};
    Object.values(grouped).forEach((perms) => {
      perms.forEach((perm) => {
        codeToIdMap[perm.code] = perm.id;
      });
    });
    return codes.map((code) => codeToIdMap[code]).filter((id) => id !== undefined);
  }

  /**
   * Fetch roles from identity service.
   * Same endpoint as platform: GET /api/v1/identity/roles
   */
  static async listRoles(): Promise<Role[]> {
    const headers = this.getHeaders();
    let response: Response;
    try {
      const params = new URLSearchParams({
        skip: '0',
        limit: '100',
        include_permissions: 'true',
      });
      response = await fetch(
        `${API_IDENTITY_URL}/api/v1/identity/roles?${params}`,
        { headers }
      );
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      handleApiError(error);
    }

    const data = await response!.json();
    return data.data ?? data;
  }

  /**
   * Create a new role via identity service.
   * Same endpoint as platform: POST /api/v1/identity/roles
   * Converts permission codes → IDs before sending (same as platform).
   */
  static async createRole(formData: RoleFormData): Promise<Role> {
    const headers = this.getHeaders();
    const permissionIds = await this.getPermissionIds(formData.permissions);
    const code = formData.name.toLowerCase().replace(/\s+/g, '_');

    const payload = {
      name: formData.name,
      code,
      description: formData.description || '',
      is_system: false,
      is_default: false,
      hierarchy_level: 0,
      is_active: true,
      extra_data: {},
      permission_ids: permissionIds,
    };

    let response: Response;
    try {
      response = await fetch(`${API_IDENTITY_URL}/api/v1/identity/roles`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      handleApiError(error);
    }

    return response!.json();
  }

  /**
   * Update an existing role via identity service.
   * Same endpoint as platform: PUT /api/v1/identity/roles/:id
   */
  static async updateRole(id: string, formData: Partial<RoleFormData>): Promise<Role> {
    const headers = this.getHeaders();
    const payload: Record<string, unknown> = {};

    if (formData.name) {
      payload.name = formData.name;
      payload.code = formData.name.toLowerCase().replace(/\s+/g, '_');
    }
    if (formData.description !== undefined) {
      payload.description = formData.description;
    }
    if (formData.permissions && formData.permissions.length > 0) {
      payload.permission_ids = await this.getPermissionIds(formData.permissions);
    }

    let response: Response;
    try {
      response = await fetch(`${API_IDENTITY_URL}/api/v1/identity/roles/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      handleApiError(error);
    }

    return response!.json();
  }

  /** Delete a role via identity service. */
  static async deleteRole(id: string): Promise<void> {
    const headers = this.getHeaders();
    let response: Response;
    try {
      response = await fetch(`${API_IDENTITY_URL}/api/v1/identity/roles/${id}`, {
        method: 'DELETE',
        headers,
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      handleApiError(error);
    }
  }

  /**
   * Fetch permissions grouped by category from the identity service.
   * Passes include_system_admin=true so super admin sees all permission levels.
   * Same endpoint as platform: GET /api/v1/identity/permissions/grouped
   * Returns a flat map of category name → permissions[].
   */
  static async listGroupedPermissions(): Promise<GroupedPermissions> {
    const headers = this.getHeaders();
    let response: Response;
    try {
      response = await fetch(
        `${API_IDENTITY_URL}/api/v1/identity/permissions/grouped?include_system_admin=true`,
        { headers }
      );
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      handleApiError(error);
    }

    const data: GroupedPermissionsResponse = await response!.json();

    // Transform categories array into a flat map for the UI
    const grouped: GroupedPermissions = {};
    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        if (category.name && category.permissions) {
          grouped[category.name] = category.permissions;
        }
      }
    }

    return grouped;
  }
}
