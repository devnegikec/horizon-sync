import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminUserFilters,
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminUserCreate,
  AdminUserUpdate,
} from '../types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class AdminUserService {
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

  static async list(
    filters?: AdminUserFilters
  ): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active != null) params.append('is_active', String(filters.is_active));
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    const endpoint = `/api/v1/admin/users${query ? `?${query}` : ''}`;

    return this.request<AdminUserListResponse>(endpoint);
  }

  static async getById(id: string): Promise<AdminUserDetailResponse> {
    return this.request<AdminUserDetailResponse>(
      `/api/v1/admin/users/${id}`
    );
  }

  static async create(
    data: AdminUserCreate
  ): Promise<AdminUserDetailResponse> {
    return this.request<AdminUserDetailResponse>(
      '/api/v1/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  static async update(
    id: string,
    data: AdminUserUpdate
  ): Promise<AdminUserDetailResponse> {
    return this.request<AdminUserDetailResponse>(
      `/api/v1/admin/users/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  static async searchUsers(filters: {
    query: string;
    page_size?: number;
    exclude_system_admins?: boolean;
  }): Promise<{ users: Array<{ id: string; username: string; email: string; full_name: string }> }> {
    const params = new URLSearchParams();
    params.append('search', filters.query);
    if (filters.page_size) params.append('page_size', String(filters.page_size));
    if (filters.exclude_system_admins) params.append('exclude_system_admins', 'true');

    const query = params.toString();
    const endpoint = `/api/v1/admin/users/search${query ? `?${query}` : ''}`;

    return this.request<{ users: Array<{ id: string; username: string; email: string; full_name: string }> }>(endpoint);
  }
}
