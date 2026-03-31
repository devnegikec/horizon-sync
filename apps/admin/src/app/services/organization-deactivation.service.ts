import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_IDENTITY_URL = environment.apiIdentityUrl;

// Types for Organization Deactivation
interface DeactivationActionResponse {
  organization_id: string;
  organization_name: string;
  action_type: string;
  previous_status: string;
  new_status: string;
  action_date: string;
  performed_by: string;
  reason?: string;
  additional_info?: Record<string, unknown>;
}

interface DeactivationSummaryResponse {
  total_organizations: number;
  trial_expired_count: number;
  subscription_expired_count: number;
  overdue_payment_count: number;
  suspended_count: number;
  cancelled_count: number;
  last_check_date?: string;
  actions_pending: DeactivationActionResponse[];
}

interface OrganizationStatusResponse {
  organization_id: string;
  organization_name: string;
  current_status: string;
  billing_status?: string;
  trial_end_date?: string;
  subscription_end_date?: string;
  last_payment_date?: string;
  next_billing_date?: string;
  days_since_last_payment?: number;
  deactivation_history: Array<Record<string, unknown>>;
}

interface ReactivationResponse {
  organization_id: string;
  organization_name: string;
  previous_status: string;
  new_status: string;
  reactivation_date: string;
  new_subscription_end_date: string;
  reactivated_by: string;
  reactivation_notes?: string;
}

interface ExpireTrialRequest {
  reason?: string;
  send_notification?: boolean;
}

interface ExpireSubscriptionRequest {
  reason?: string;
  send_notification?: boolean;
}

interface SuspendOrganizationRequest {
  days_overdue: number;
  suspension_reason?: string;
  send_notification?: boolean;
}

interface CancelSubscriptionRequest {
  cancellation_reason: string;
  effective_date?: string;
  grace_period_days?: number;
  send_notification?: boolean;
}

interface ReactivateOrganizationRequest {
  new_subscription_end_date: string;
  reactivation_notes?: string;
  send_notification?: boolean;
}

export class OrganizationDeactivationService {
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
      response = await fetch(`${API_IDENTITY_URL}${endpoint}`, {
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

    return response.json();
  }

  // Check organizations for deactivation
  static async checkOrganizationsForDeactivation(): Promise<DeactivationActionResponse[]> {
    return this.request<DeactivationActionResponse[]>(
      '/api/v1/organization-deactivation/check-deactivations'
    );
  }

  // Get deactivation summary
  static async getDeactivationSummary(): Promise<DeactivationSummaryResponse> {
    return this.request<DeactivationSummaryResponse>(
      '/api/v1/organization-deactivation/deactivation-summary'
    );
  }

  // Expire trial
  static async expireTrial(
    organizationId: string,
    request: ExpireTrialRequest
  ): Promise<DeactivationActionResponse> {
    return this.request<DeactivationActionResponse>(
      `/api/v1/organization-deactivation/expire-trial/${organizationId}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Expire subscription
  static async expireSubscription(
    organizationId: string,
    request: ExpireSubscriptionRequest
  ): Promise<DeactivationActionResponse> {
    return this.request<DeactivationActionResponse>(
      `/api/v1/organization-deactivation/expire-subscription/${organizationId}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Suspend organization for non-payment
  static async suspendOrganization(
    organizationId: string,
    request: SuspendOrganizationRequest
  ): Promise<DeactivationActionResponse> {
    return this.request<DeactivationActionResponse>(
      `/api/v1/organization-deactivation/suspend/${organizationId}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Cancel subscription
  static async cancelSubscription(
    organizationId: string,
    request: CancelSubscriptionRequest
  ): Promise<DeactivationActionResponse> {
    return this.request<DeactivationActionResponse>(
      `/api/v1/organization-deactivation/cancel-subscription/${organizationId}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Reactivate organization
  static async reactivateOrganization(
    organizationId: string,
    request: ReactivateOrganizationRequest
  ): Promise<ReactivationResponse> {
    return this.request<ReactivationResponse>(
      `/api/v1/organization-deactivation/reactivate/${organizationId}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Bulk suspend organizations
  static async bulkSuspendOrganizations(
    organizationIds: string[],
    daysOverdue: number,
    suspensionReason?: string
  ): Promise<DeactivationActionResponse[]> {
    return this.request<DeactivationActionResponse[]>(
      `/api/v1/organization-deactivation/bulk-suspension?days_overdue=${daysOverdue}&suspension_reason=${encodeURIComponent(suspensionReason || 'Bulk suspension for non-payment')}`,
      {
        method: 'POST',
        body: JSON.stringify(organizationIds),
      }
    );
  }

  // Get organization deactivation status
  static async getOrganizationStatus(
    organizationId: string
  ): Promise<OrganizationStatusResponse> {
    return this.request<OrganizationStatusResponse>(
      `/api/v1/organization-deactivation/organization-status/${organizationId}`
    );
  }

  // Get all organizations requiring deactivation action
  static async getOrganizationsRequiringAction(): Promise<{
    trial_expired: Array<{ organization_id: string; organization_name: string; days_expired: number }>;
    subscription_expired: Array<{ organization_id: string; organization_name: string; days_expired: number }>;
    payment_overdue: Array<{ organization_id: string; organization_name: string; days_overdue: number; amount_due: number }>;
  }> {
    return this.request('/api/v1/organization-deactivation/organizations-requiring-action');
  }
}