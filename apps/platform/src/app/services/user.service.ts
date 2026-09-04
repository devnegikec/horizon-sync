import { environment } from '../../environments/environment';

function getFriendlyMessage(status: number): string {
  switch (status) {
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested resource was not found.';
    case 422: return 'The submitted data is invalid. Please check your input.';
    case 500: return 'An unexpected server error occurred. Please try again later.';
    case 502: case 503: case 504: return 'The service is temporarily unavailable. Please try again in a few moments.';
    default: return 'Something went wrong. Please try again later.';
  }
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'regular' | 'admin' | 'system';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  is_active: boolean;
  email_verified: boolean;
  mfa_enabled: boolean;
  timezone: string | null;
  language: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface InviteUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  organization_id?: string;
  role_id?: string;
  team_ids?: string[];
  message?: string;
  extra_data?: Record<string, unknown>;
}

export interface InviteUserResponse {
  invitation_id: string;
  email: string;
  expires_at: string;
  invitation_url: string;
}

export interface InvitationResponse {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id?: string | null;
  role_name?: string | null;
  custom_permission_ids?: string[] | null;
  team_ids?: string[] | null;
  invited_by_id?: string | null;
  invited_by_email?: string | null;
  status: string;
  expires_at: string;
  accepted_at?: string | null;
  message?: string | null;
  extra_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface InvitationListResponse {
  data: InvitationResponse[];
  total: number;
  skip: number;
  limit: number;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  status?: string;
  is_active?: boolean;
  phone?: string;
  preferences?: Record<string, unknown>;
  extra_data?: Record<string, unknown>;
  timezone?: string;
  language?: string;
  avatar_url?: string;
}

const API_BASE_URL = environment.apiBaseUrl;

export class UserService {
  static async updateMe(payload: UpdateUserPayload, token: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to update user profile',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating user profile');
    }
  }

  static async getUsers(page = 1, pageSize = 20, token: string): Promise<UsersResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/users?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to fetch users',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data: UsersResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching users');
    }
  }

  static async inviteUser(payload: InviteUserPayload, token: string): Promise<InviteUserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to invite user',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data: InviteUserResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while inviting user');
    }
  }

  static async updateUser(userId: string, payload: UpdateUserPayload, token: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to update user',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating user');
    }
  }

  static async getPendingInvitationCount(
    organizationId: string,
    token: string
  ): Promise<number> {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        status: 'pending',
        skip: '0',
        limit: '1',
      });
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/invitations?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to fetch pending invitations',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data = (await response.json()) as InvitationListResponse;
      return data.total ?? 0;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching pending invitations');
    }
  }

  static async getInvitations(
    organizationId: string,
    token: string,
    options: { status?: string; search?: string; skip?: number; limit?: number } = {}
  ): Promise<InvitationListResponse> {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        skip: String(options.skip ?? 0),
        limit: String(options.limit ?? 100),
      });
      if (options.status) {
        params.append('status', options.status);
      }
      if (options.search) {
        params.append('search', options.search);
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/identity/invitations?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to fetch invitations',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data = (await response.json()) as InvitationListResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching invitations');
    }
  }

  static async resendInvitation(invitationId: string, token: string): Promise<InvitationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to resend invitation',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data = (await response.json()) as InvitationResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while resending invitation');
    }
  }

  static async getUserPermissions(
    userId: string,
    organizationId: string,
    token: string
  ): Promise<{ permissions: string[]; roles: string[]; custom_permissions: string[]; has_access: boolean }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/identity/users/${userId}/permissions?organization_id=${organizationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to load user permissions',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      return (await response.json()) as {
        permissions: string[];
        roles: string[];
        custom_permissions: string[];
        has_access: boolean;
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while loading user permissions');
    }
  }

  static async updateUserRoles(
    userId: string,
    organizationId: string,
    roleIds: string[],
    customPermissionIds: string[],
    token: string
  ): Promise<{ user_id: string; organization_id: string; roles: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/identity/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          role_ids: roleIds,
          custom_permission_ids: customPermissionIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to update user roles',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data = (await response.json()) as { user_id: string; organization_id: string; roles: string[] };
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating user roles');
    }
  }
}
