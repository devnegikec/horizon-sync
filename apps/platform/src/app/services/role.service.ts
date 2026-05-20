import { environment } from '../../environments/environment';
import type { Role, RoleListResponse, RoleFormData, RoleFilters, PermissionGroupedResponse, Permission } from '../types/role.types';

const API_BASE_URL = environment.apiBaseUrl;

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  retryable: boolean;
}

/**
 * Handle API errors consistently
 */
function handleAPIError(error: unknown): AppError {
  if (error instanceof Response) {
    return handleResponseError(error);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network error. Please check your connection and try again.',
      retryable: true,
    };
  }

  return {
    type: ErrorType.SERVER_ERROR,
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    retryable: false,
  };
}

function handleResponseError(error: Response): AppError {
  const status = error.status;

  if (status === 401) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: 'Session expired. Please log in again.',
      retryable: false,
    };
  }

  if (status === 403) {
    return {
      type: ErrorType.PERMISSION_ERROR,
      message: "You don't have permission to perform this action.",
      retryable: false,
    };
  }

  if (status === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: 'The requested resource was not found.',
      retryable: false,
    };
  }

  if (status === 422) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message: 'Validation error',
      retryable: false,
    };
  }

  if (status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: 'Server error. Please try again later.',
      retryable: true,
    };
  }

  return {
    type: ErrorType.SERVER_ERROR,
    message: 'An unexpected error occurred.',
    retryable: true,
  };
}

export class RoleService {
  /**
   * Get list of roles with filters
   */
  static async getRoles(filters: RoleFilters, token: string): Promise<RoleListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.isSystem !== null) params.append('is_system', String(filters.isSystem));
      if (filters.isActive !== null) params.append('is_active', String(filters.isActive));
      params.append('skip', String((filters.page - 1) * filters.pageSize));
      params.append('limit', String(filters.pageSize));
      params.append('include_permissions', 'true');

      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      // API returns: { data, total, skip, limit }
      // Frontend expects: { data, pagination: { total_count, page, page_size, ... } }
      const raw = await response.json();
      const page = filters.page;
      const pageSize = filters.pageSize;
      const total = raw.total ?? 0;
      const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

      return {
        data: raw.data ?? [],
        pagination: {
          total_count: total,
          page,
          page_size: pageSize,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      };
    } catch (error) {
      throw handleAPIError(error);
    }
  }
  static async getRole(roleId: string, token: string): Promise<Role> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles/${roleId}?include_permissions=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Helper method to convert permission codes to IDs
   */
  private static async getPermissionIds(codes: string[], token: string): Promise<string[]> {
    const allPermissionsResponse = await fetch(`${API_BASE_URL}/api/v1/identity/permissions/grouped`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!allPermissionsResponse.ok) {
      throw allPermissionsResponse;
    }

    const permissionsData = await allPermissionsResponse.json();

    // Build a map of permission codes to IDs
    const codeToIdMap: Record<string, string> = {};
    if (permissionsData.categories && Array.isArray(permissionsData.categories)) {
      permissionsData.categories.forEach((category: { permissions: Permission[] }) => {
        category.permissions.forEach((perm: Permission) => {
          codeToIdMap[perm.code] = perm.id;
        });
      });
    }

    // Convert permission codes to IDs
    return codes.map((code) => codeToIdMap[code]).filter((id) => id !== undefined);
  }

  /**
   * Create a new role
   */
  static async createRole(data: RoleFormData, token: string, organizationId?: string | null): Promise<Role> {
    try {
      // Convert permission codes to permission IDs
      const permissionIds = await this.getPermissionIds(data.permissions, token);

      // Generate a code from the name (lowercase, replace spaces with underscores)
      const code = data.name.toLowerCase().replace(/\s+/g, '_');

      const payload: Record<string, unknown> = {
        name: data.name,
        code: code,
        description: data.description || '',
        is_system: false,
        is_default: false,
        hierarchy_level: 0,
        is_active: true,
        extra_data: {},
        permission_ids: permissionIds,
      };

      // Add organization_id if provided
      if (organizationId) {
        payload.organization_id = organizationId;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw response;
      }

      return await response.json();
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(roleId: string, data: Partial<RoleFormData>, token: string): Promise<Role> {
    try {
      const payload: Record<string, unknown> = {};

      if (data.name) {
        payload.name = data.name;
        payload.code = data.name.toLowerCase().replace(/\s+/g, '_');
      }

      if (data.description !== undefined) {
        payload.description = data.description;
      }

      // Step 1: Update role metadata (name, description, etc.)
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw response;
      }

      const updatedRole: Role = await response.json();

      // Step 2: Update permissions via bulk assign (replace mode)
      // The PUT endpoint does not accept permission_ids — use the dedicated bulk endpoint.
      if (data.permissions !== undefined) {
        const permissionIds = data.permissions.length > 0
          ? await this.getPermissionIds(data.permissions, token)
          : [];

        const permResponse = await fetch(
          `${API_BASE_URL}/api/v1/identity/roles/${roleId}/permissions/bulk`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permission_ids: permissionIds, mode: 'replace' }),
          }
        );

        if (!permResponse.ok) {
          throw permResponse;
        }
      }

      return updatedRole;
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Get permissions grouped by module → resource.
   *
   * The API now returns:
   *   { modules: [...], categories: [...], uncategorized: [...] }
   *
   * We build two things from this:
   *   1. `modules`  — the new module-grouped structure for the module-toggle UI
   *   2. `data`     — the legacy flat map { resource: Permission[] } for PermissionMatrix
   */
  static async getGroupedPermissions(token: string): Promise<PermissionGroupedResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/permissions/grouped`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      const apiResponse = await response.json();

      // ── Build legacy flat map from modules (preferred) or categories (fallback) ──
      const grouped: Record<string, Permission[]> = {};

      if (apiResponse.modules && Array.isArray(apiResponse.modules)) {
        // New structure: modules → resources → permissions
        apiResponse.modules.forEach((mod: { resources: Array<{ key: string; permissions: Permission[] }> }) => {
          mod.resources.forEach((resource) => {
            const key = resource.key || 'other';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(...resource.permissions);
          });
        });
      } else if (apiResponse.categories && Array.isArray(apiResponse.categories)) {
        // Legacy fallback: categories → permissions grouped by resource
        apiResponse.categories.forEach((category: { permissions: Permission[] }) => {
          if (!category.permissions) return;
          category.permissions.forEach((perm: Permission) => {
            const key = perm.resource || 'other';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(perm);
          });
        });
      }

      // Also handle uncategorized permissions
      if (apiResponse.uncategorized && Array.isArray(apiResponse.uncategorized)) {
        apiResponse.uncategorized.forEach((perm: Permission) => {
          const key = perm.resource || 'other';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(perm);
        });
      }

      // Sort permissions within each resource group by action
      const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'manage', 'execute'];
      for (const perms of Object.values(grouped)) {
        perms.sort((a, b) => {
          const aIdx = ACTION_ORDER.indexOf(a.action);
          const bIdx = ACTION_ORDER.indexOf(b.action);
          return (aIdx === -1 ? ACTION_ORDER.length : aIdx) - (bIdx === -1 ? ACTION_ORDER.length : bIdx);
        });
      }

      return {
        modules: apiResponse.modules ?? [],
        categories: apiResponse.categories ?? [],
        uncategorized: apiResponse.uncategorized ?? [],
        data: grouped,
      };
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Get all permissions with optional filters
   */
  static async getPermissions(token: string, filters?: { search?: string; module?: string }): Promise<Permission[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.module) params.append('module', filters.module);

      const response = await fetch(`${API_BASE_URL}/api/v1/identity/permissions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Get users assigned to a role
   */
  static async getRoleUsers(roleId: string, token: string): Promise<Array<{ id: string; name: string; email: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/roles/${roleId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      throw handleAPIError(error);
    }
  }
}
