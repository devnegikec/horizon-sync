import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;
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

export interface SystemAdminRole {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_system: boolean;
  permissions: RolePermission[];
}

export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdateRolePayload {
  name?: string;
  code?: string;
  description?: string;
  permission_ids?: string[];
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

export class AdminRoleService {
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = useUserStore.getState().accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let response: Response;
    try {
      response = await fetch(`${API_CORE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      try {
        (error as Error & { data?: unknown }).data = await response!.json();
      } catch {
        // ignore JSON parse failure
      }
      handleApiError(error);
    }

    return response!.json();
  }

  /** Fetch all system admin roles with their associated permissions. */
  static async listRoles(): Promise<SystemAdminRole[]> {
    return this.request<SystemAdminRole[]>('/api/v1/admin/roles');
  }

  /** Create a new system admin role. */
  static async createRole(data: CreateRolePayload): Promise<SystemAdminRole> {
    return this.request<SystemAdminRole>('/api/v1/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Update an existing system admin role. */
  static async updateRole(
    id: string,
    data: UpdateRolePayload
  ): Promise<SystemAdminRole> {
    return this.request<SystemAdminRole>(`/api/v1/admin/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /** Delete a system admin role. */
  static async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/roles/${id}`, {
      method: 'DELETE',
    });
  }

  /** List all available system admin permissions. */
  static async listPermissions(): Promise<RolePermission[]> {
    return this.request<RolePermission[]>('/api/v1/admin/permissions');
  }

  /**
   * Fetch permissions grouped by category from the identity service.
   * Passes include_system_admin=true so super admin sees all permission levels.
   * Returns a flat map of category name → permissions[].
   */
  static async listGroupedPermissions(): Promise<GroupedPermissions> {
    const token = useUserStore.getState().accessToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

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
      try {
        (error as Error & { data?: unknown }).data = await response!.json();
      } catch {
        // ignore JSON parse failure
      }
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
