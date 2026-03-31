import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_IDENTITY_URL = environment.apiIdentityUrl;

// Types for System Admin Permissions
interface SystemAdminPermission {
  permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
  description: string;
  allowed_organizations?: string[];
  permission_scope: 'all' | 'specific';
}

interface SystemAdminUser {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  permissions: SystemAdminPermission[];
  assigned_by: string;
  assigned_date: string;
  last_active?: string;
}

interface AssignSystemAdminRequest {
  user_id: string;
  permissions: Array<{
    permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
    allowed_organizations?: string[];
  }>;
  notes?: string;
}

interface UpdateSystemAdminRequest {
  permissions: Array<{
    permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
    allowed_organizations?: string[];
  }>;
  notes?: string;
}

interface OrganizationAccessInfo {
  organization_id: string;
  organization_name: string;
  access_type: 'full' | 'billing_only' | 'reporting_only';
  granted_by: string;
  granted_date: string;
}

interface SystemAdminAuditLog {
  action_id: string;
  action_type: 'assign' | 'update' | 'revoke' | 'access_grant' | 'access_revoke';
  admin_user_id: string;
  admin_username: string;
  target_user_id?: string;
  target_username?: string;
  target_organization_id?: string;
  target_organization_name?: string;
  changes_made: Record<string, unknown>;
  performed_by: string;
  performed_date: string;
  notes?: string;
}

export class SystemAdminPermissionsService {
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
      response = await fetch(`${API_IDENTITY_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Error & { status?: number }).status = response.status;
      try {
        (error as Error & { data?: unknown }).data = await response.json();
      } catch {
        // ignore JSON parse failure
      }
      handleApiError(error);
    }

    return response.json();
  }

  // Get all system admin users
  static async getSystemAdminUsers(params?: {
    permission_type?: string;
    organization_id?: string;
    active_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{
    admin_users: SystemAdminUser[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.size > 0 
      ? `/api/v1/organization-management/system-admin-users?${queryParams.toString()}`
      : '/api/v1/organization-management/system-admin-users';

    return this.request(endpoint);
  }

  // Get specific system admin user details
  static async getSystemAdminUser(userId: string): Promise<SystemAdminUser> {
    return this.request<SystemAdminUser>(
      `/api/v1/organization-management/system-admin-users/${userId}`
    );
  }

  // Assign user as system admin
  static async assignSystemAdmin(
    request: AssignSystemAdminRequest
  ): Promise<{ success: boolean; message: string; admin_user: SystemAdminUser }> {
    return this.request(
      '/api/v1/organization-management/assign-system-admin',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Update system admin permissions
  static async updateSystemAdminPermissions(
    userId: string,
    request: UpdateSystemAdminRequest
  ): Promise<{ success: boolean; message: string; admin_user: SystemAdminUser }> {
    return this.request(
      `/api/v1/organization-management/system-admin-users/${userId}/permissions`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  }

  // Revoke system admin permissions
  static async revokeSystemAdmin(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/organization-management/revoke-system-admin/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  }

  // Check user access to organization
  static async checkOrganizationAccess(
    userId: string,
    organizationId: string
  ): Promise<{
    has_access: boolean;
    access_type?: string;
    permissions: string[];
  }> {
    return this.request(
      `/api/v1/organization-management/check-access/${userId}/${organizationId}`
    );
  }

  // Get organization access for admin user
  static async getOrganizationAccess(
    userId: string
  ): Promise<OrganizationAccessInfo[]> {
    return this.request<OrganizationAccessInfo[]>(
      `/api/v1/organization-management/system-admin-users/${userId}/organization-access`
    );
  }

  // Grant organization access to admin user
  static async grantOrganizationAccess(
    userId: string,
    organizationId: string,
    accessType: 'full' | 'billing_only' | 'reporting_only',
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/organization-management/grant-organization-access`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          organization_id: organizationId,
          access_type: accessType,
          notes,
        }),
      }
    );
  }

  // Revoke organization access from admin user
  static async revokeOrganizationAccess(
    userId: string,
    organizationId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/organization-management/revoke-organization-access`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          organization_id: organizationId,
          reason,
        }),
      }
    );
  }

  // Get system admin audit log
  static async getSystemAdminAuditLog(params?: {
    admin_user_id?: string;
    target_user_id?: string;
    target_organization_id?: string;
    action_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    audit_logs: SystemAdminAuditLog[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.size > 0 
      ? `/api/v1/organization-management/system-admin-audit-log?${queryParams.toString()}`
      : '/api/v1/organization-management/system-admin-audit-log';

    return this.request(endpoint);
  }

  // Get available permission types
  static getAvailablePermissionTypes(): Array<{
    type: string;
    label: string;
    description: string;
    scope_required: boolean;
  }> {
    return [
      {
        type: 'master',
        label: 'Master Admin',
        description: 'Full system access across all organizations',
        scope_required: false,
      },
      {
        type: 'user_manager',
        label: 'User Manager',
        description: 'User management across specified organizations',
        scope_required: true,
      },
      {
        type: 'org_manager',
        label: 'Organization Manager',
        description: 'Organization management for specified organizations',
        scope_required: true,
      },
      {
        type: 'billing',
        label: 'Billing Admin',
        description: 'Billing and invoicing access for specified organizations',
        scope_required: true,
      },
      {
        type: 'reporting',
        label: 'Reporting Admin',
        description: 'Read-only reporting access for specified organizations',
        scope_required: true,
      },
    ];
  }
}