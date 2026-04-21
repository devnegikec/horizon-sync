import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const BASE_URL = `${environment.apiCoreUrl}/api/v1/admin/feature-flags`;

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  visible: boolean;
  scope: string;
  tenant_id: string | null;
  user_id: string | null;
  rollout_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagListResponse {
  flags: FeatureFlag[];
}

export interface FeatureFlagCreateData {
  name: string;
  description?: string | null;
  enabled?: boolean;
  visible?: boolean;
}

export interface FeatureFlagUpdateData {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  visible?: boolean;
}

export interface FeatureFlagEvaluation {
  feature_name: string;
  enabled: boolean;
  visible: boolean;
}

export class FeatureFlagService {
  private static getHeaders(): Record<string, string> {
    const token = useUserStore.getState().accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const headers = this.getHeaders();

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });
    } catch (error) {
      handleApiError(error);
    }

    if (!response!.ok) {
      const error = new Error(`HTTP error! status: ${response!.status}`);
      (error as Error & { status?: number }).status = response!.status;
      try {
        (error as Error & { data?: unknown }).data = await response!.json();
      } catch {
        // ignore JSON parse failure
      }
      handleApiError(error);
    }

    // 204 No Content (delete)
    if (response!.status === 204) {
      return undefined as T;
    }

    return response!.json();
  }

  static async listFlags(): Promise<FeatureFlagListResponse> {
    return this.request<FeatureFlagListResponse>('');
  }

  static async createFlag(
    data: FeatureFlagCreateData
  ): Promise<FeatureFlag> {
    return this.request<FeatureFlag>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateFlag(
    id: string,
    data: FeatureFlagUpdateData
  ): Promise<FeatureFlag> {
    return this.request<FeatureFlag>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteFlag(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  static async evaluateFlag(name: string): Promise<FeatureFlagEvaluation> {
    return this.request<FeatureFlagEvaluation>(`/evaluate/${name}`);
  }
}
