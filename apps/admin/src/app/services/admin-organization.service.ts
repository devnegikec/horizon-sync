import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminOrgFilters,
  AdminOrgListResponse,
  AdminOrgDetailResponse,
  AdminOrgCreate,
  AdminOrgUpdate,
} from '../types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class AdminOrganizationService {
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
    filters?: AdminOrgFilters
  ): Promise<AdminOrgListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    const endpoint = `/api/v1/admin/organizations${query ? `?${query}` : ''}`;

    return this.request<AdminOrgListResponse>(endpoint);
  }

  static async getById(id: string): Promise<AdminOrgDetailResponse> {
    return this.request<AdminOrgDetailResponse>(
      `/api/v1/admin/organizations/${id}`
    );
  }

  static async create(
    data: AdminOrgCreate
  ): Promise<AdminOrgDetailResponse> {
    return this.request<AdminOrgDetailResponse>(
      '/api/v1/admin/organizations',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  static async update(
    id: string,
    data: AdminOrgUpdate
  ): Promise<AdminOrgDetailResponse> {
    return this.request<AdminOrgDetailResponse>(
      `/api/v1/admin/organizations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }
}
