import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminProfile,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
} from '../types';
import { handleApiError } from '../utils/error-handler';

const API_BASE_URL = environment.apiBaseUrl;

export class AdminAuthService {
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
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  static async login(
    payload: LoginPayload
  ): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/v1/identity/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async refresh(refreshToken?: string): Promise<RefreshResponse> {
    const body: { refresh_token?: string } = {};
    if (refreshToken) {
      body.refresh_token = refreshToken;
    }

    return this.request<RefreshResponse>('/api/v1/identity/refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async getAdminProfile(token: string): Promise<AdminProfile> {
    return this.request<AdminProfile>('/api/v1/identity/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  static async logout(
    payload?: { refresh_token?: string }
  ): Promise<void> {
    return this.request<void>('/api/v1/identity/logout', {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }
}
