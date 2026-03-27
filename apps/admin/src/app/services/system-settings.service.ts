import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type {
  AdminOrgDetailResponse,
  AdminUserListItem,
  AdminUserCreate,
} from '../types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export interface SystemSettings {
  master_organization: AdminOrgDetailResponse;
  subscription_config: {
    default_seat_limit: number;
    default_credit_limit: number;
    base_price_per_seat: number;
    credit_rate: number;
    billing_cycles: string[];
  };
  system_config: {
    auto_deactivate_enabled: boolean;
    auto_deactivate_days: number;
    grace_period_days: number;
    reminder_frequency_days: number;
  };
}

export interface SystemSettingsUpdate {
  subscription_config?: {
    default_seat_limit?: number;
    default_credit_limit?: number;
    base_price_per_seat?: number;
    credit_rate?: number;
  };
  system_config?: {
    auto_deactivate_enabled?: boolean;
    auto_deactivate_days?: number;
    grace_period_days?: number;
    reminder_frequency_days?: number;
  };
}

export interface SystemAdminUser extends AdminUserListItem {
  roles: string[];
  created_at: string;
}

export class SystemSettingsService {
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
      return undefined as T;
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get system settings including master org and default configurations
   */
  static async getSystemSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/admin/system/settings');
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(updates: SystemSettingsUpdate): Promise<SystemSettings> {
    return this.request<SystemSettings>('/admin/system/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get master organization details
   */
  static async getMasterOrganization(): Promise<AdminOrgDetailResponse> {
    return this.request<AdminOrgDetailResponse>('/admin/system/master-organization');
  }

  /**
   * Update master organization details
   */
  static async updateMasterOrganization(updates: Partial<AdminOrgDetailResponse>): Promise<AdminOrgDetailResponse> {
    return this.request<AdminOrgDetailResponse>('/admin/system/master-organization', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get system admin users (users in master organization)
   */
  static async getSystemAdminUsers(): Promise<{ users: SystemAdminUser[]; total: number }> {
    return this.request<{ users: SystemAdminUser[]; total: number }>('/admin/system/admin-users');
  }

  /**
   * Create new system admin user
   */
  static async createSystemAdminUser(userData: AdminUserCreate): Promise<SystemAdminUser> {
    return this.request<SystemAdminUser>('/admin/system/admin-users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Update system admin user
   */
  static async updateSystemAdminUser(
    userId: string, 
    updates: Partial<AdminUserCreate>
  ): Promise<SystemAdminUser> {
    return this.request<SystemAdminUser>(`/admin/system/admin-users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Remove system admin user (deactivate)
   */
  static async removeSystemAdminUser(userId: string): Promise<void> {
    return this.request<void>(`/admin/system/admin-users/${userId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get system statistics and metrics
   */
  static async getSystemStats(): Promise<{
    total_organizations: number;
    active_organizations: number;
    overdue_organizations: number;
    total_users: number;
    active_users: number;
    total_invoices: number;
    overdue_invoices: number;
    total_revenue: string;
  }> {
    return this.request<{
      total_organizations: number;
      active_organizations: number;
      overdue_organizations: number;
      total_users: number;
      active_users: number;
      total_invoices: number;
      overdue_invoices: number;
      total_revenue: string;
    }>('/admin/system/stats');
  }

  /**
   * Test system connectivity and health
   */
  static async testSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    services: {
      database: 'ok' | 'error';
      identity_service: 'ok' | 'error';
      core_service: 'ok' | 'error';
      search_service: 'ok' | 'error';
    };
    timestamp: string;
  }> {
    return this.request<{
      status: 'healthy' | 'warning' | 'error';
      services: {
        database: 'ok' | 'error';
        identity_service: 'ok' | 'error';
        core_service: 'ok' | 'error';
        search_service: 'ok' | 'error';
      };
      timestamp: string;
    }>('/admin/system/health');
  }
}