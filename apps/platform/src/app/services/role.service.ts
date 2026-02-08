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

      const response = await fetch(`${API_BASE_URL}/identity/roles?${params}`, {
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
   * Get a single role by ID
   */
  static async getRole(roleId: string, token: string): Promise<Role> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/roles/${roleId}?include_permissions=true`, {
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
    const allPermissionsResponse = await fetch(`${API_BASE_URL}/identity/permissions/grouped`, {
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

      const response = await fetch(`${API_BASE_URL}/identity/roles`, {
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

      // If permissions are being updated, convert codes to IDs
      if (data.permissions && data.permissions.length > 0) {
        payload.permission_ids = await this.getPermissionIds(data.permissions, token);
      }

      const response = await fetch(`${API_BASE_URL}/identity/roles/${roleId}`, {
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

      return await response.json();
    } catch (error) {
      throw handleAPIError(error);
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/roles/${roleId}`, {
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
   * Get permissions grouped by module
   */
  static async getGroupedPermissions(token: string): Promise<PermissionGroupedResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/permissions/grouped`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw response;
      }

      const apiResponse = await response.json();

      // Transform API response to match our expected format
      // API returns: { categories: [{ name, permissions: [...] }] }
      // We need: { data: { "Category Name": [...permissions] } }
      const grouped: Record<string, Permission[]> = {};

      if (apiResponse.categories && Array.isArray(apiResponse.categories)) {
        apiResponse.categories.forEach((category: { name: string; permissions: Permission[] }) => {
          if (category.name && category.permissions) {
            grouped[category.name] = category.permissions;
          }
        });
      }

      return { data: grouped };
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

      const response = await fetch(`${API_BASE_URL}/identity/permissions?${params}`, {
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
      const response = await fetch(`${API_BASE_URL}/identity/roles/${roleId}/users`, {
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
