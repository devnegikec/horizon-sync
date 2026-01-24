import { environment } from '../../environments/environment';

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

export interface UserType {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  id: string;
  display_name: string;
  user_type: string;
  status: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface RegisterResponse {
  user: UserType;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  organization_id: string;
  message?: string;
}

export interface LogoutPayload {
  refresh_token: string;
}

export interface ApiError {
  message: string;
  details?: unknown;
}

const API_BASE_URL = environment.apiBaseUrl;

export class AuthService {
  static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Registration failed',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: RegisterResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during registration');
    }
  }

  static async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Login failed',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  static async logout(payload: LogoutPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Logout failed',
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during logout');
    }
  }
}
