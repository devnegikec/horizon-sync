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

  static async getPendingInvitations(
    organizationId: string,
    token: string,
    search = '',
    skip = 0,
    limit = 100
  ): Promise<InvitationListResponse> {
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        status: 'pending',
        skip: String(skip),
        limit: String(limit),
      });
      if (search) {
        params.append('search', search);
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
          message: 'Failed to fetch pending invitations',
        }));
        throw new Error(errorData.message || errorData.detail || getFriendlyMessage(response.status));
      }

      const data = (await response.json()) as InvitationListResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching pending invitations');
    }
  }
}
