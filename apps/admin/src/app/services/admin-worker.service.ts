import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminWorkerCreate,
  AdminWorkerCreateResponse,
  AdminWorkerListResponse,
  AdminWorkerFilters,
} from '../types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;
const API_IDENTITY_URL = environment.apiIdentityUrl;

export class AdminWorkerService {
  private static async identityRequest<T>(
    endpoint: string,
    options?: RequestInit,
    responseType?: 'json' | 'blob'
  ): Promise<T> {
    return this.fetchWithBase<T>(API_IDENTITY_URL, endpoint, options, responseType);
  }

  private static async coreRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    return this.fetchWithBase<T>(API_CORE_URL, endpoint, options);
  }

  private static async fetchWithBase<T>(
    baseUrl: string,
    endpoint: string,
    options?: RequestInit,
    responseType?: 'json' | 'blob'
  ): Promise<T> {
    const token = useUserStore.getState().accessToken;

    const headers: Record<string, string> = {
      ...(responseType !== 'blob' ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${endpoint}`, {
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

    if (responseType === 'blob') {
      return response.blob() as Promise<T>;
    }

    return response.json();
  }

  /** Create a warehouse worker user via the Identity Service */
  static async create(
    data: AdminWorkerCreate
  ): Promise<AdminWorkerCreateResponse> {
    return this.identityRequest<AdminWorkerCreateResponse>(
      '/api/v1/identity/admin/create-worker',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  /** List warehouse workers (filtered by user_type=warehouse_worker) via Core Service */
  static async list(
    filters?: AdminWorkerFilters
  ): Promise<AdminWorkerListResponse> {
    const params = new URLSearchParams();
    params.append('user_type', 'warehouse_worker');
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active != null) params.append('is_active', String(filters.is_active));
    if (filters?.page != null) params.append('page', String(filters.page));
    if (filters?.page_size != null) params.append('page_size', String(filters.page_size));

    const query = params.toString();
    const endpoint = `/api/v1/admin/users${query ? `?${query}` : ''}`;

    return this.coreRequest<AdminWorkerListResponse>(endpoint);
  }

  /** Download QR code PNG image for a worker via Identity Service */
  static async getWorkerQRImage(userId: string): Promise<Blob> {
    return this.identityRequest<Blob>(
      `/api/v1/identity/workers/${userId}/qr-image`,
      {},
      'blob'
    );
  }
}
