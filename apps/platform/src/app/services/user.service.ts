import { environment } from '../../environments/environment';

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
      const response = await fetch(`${API_BASE_URL}/identity/users/me`, {
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
      const response = await fetch(`${API_BASE_URL}/users?page=${page}&page_size=${pageSize}`, {
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
      const response = await fetch(`${API_BASE_URL}/users/invite`, {
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
}
