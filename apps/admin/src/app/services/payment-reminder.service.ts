import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { ReminderConfig, ReminderLog, ReminderConfigCreateRequest } from '../types/billing.types';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

export class PaymentReminderService {
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

    return response.json();
  }

  // ── Reminder Configuration Management ─────────────────────────────────

  static async getReminderConfigs(params: {
    page?: number;
    page_size?: number;
    search?: string;
    organization_id?: string;
    status?: string;
  }): Promise<{
    data: ReminderConfig[];
    page: number;
    total_pages: number;
    total: number;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payment-reminders/configs${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  static async getReminderConfig(configId: string): Promise<ReminderConfig> {
    return this.request<ReminderConfig>(`/api/v1/admin/payment-reminders/configs/${configId}`);
  }

  static async createReminderConfig(configData: ReminderConfigCreateRequest): Promise<ReminderConfig> {
    return this.request<ReminderConfig>('/api/v1/admin/payment-reminders/configs', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  static async updateReminderConfig(
    configId: string,
    updateData: Partial<ReminderConfigCreateRequest>
  ): Promise<ReminderConfig> {
    return this.request<ReminderConfig>(`/api/v1/admin/payment-reminders/configs/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  static async deleteReminderConfig(configId: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/payment-reminders/configs/${configId}`, {
      method: 'DELETE',
    });
  }

  static async toggleReminderConfig(
    configId: string,
    enabled: boolean
  ): Promise<ReminderConfig> {
    return this.request<ReminderConfig>(`/api/v1/admin/payment-reminders/configs/${configId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ is_enabled: enabled }),
    });
  }

  // ── Reminder Logs & History ───────────────────────────────────────────

  static async getReminderLogs(params: {
    page?: number;
    page_size?: number;
    search?: string;
    organization_id?: string;
    reminder_stage?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    data: ReminderLog[];
    page: number;
    total_pages: number;
    total: number;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payment-reminders/logs${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  static async getReminderLog(logId: string): Promise<ReminderLog> {
    return this.request<ReminderLog>(`/api/v1/admin/payment-reminders/logs/${logId}`);
  }

  // ── Manual Reminder Operations ────────────────────────────────────────

  static async sendReminder(params: {
    organization_id: string;
    invoice_ids: string[];
    reminder_stage: 'first_reminder' | 'second_reminder' | 'final_notice' | 'deactivation_notice';
    custom_message?: string;
  }): Promise<{
    reminder_log_id: string;
    sent: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/send`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static async sendBatchReminders(params: {
    organization_ids: string[];
    force_send?: boolean;
    dry_run?: boolean;
  }): Promise<{
    organizations: number;
    would_process?: number;
    would_send?: number;
    would_skip?: number;
    sent?: number;
    failed?: number;
    skipped?: number;
    breakdown_by_stage?: Record<string, number>;
    breakdown_by_org?: Array<{ organization_id: string; overdue_invoices: number; would_send: number; would_skip: number; stages: Record<string, number> }>;
    dry_run?: boolean;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/send-batch`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ── Reminder Templates ────────────────────────────────────────────────

  static async getReminderTemplates(): Promise<{
    templates: Array<{
      stage: string;
      template_name: string;
      subject: string;
      content: string;
      is_active: boolean;
    }>;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/templates`);
  }

  static async updateReminderTemplate(params: {
    stage: 'gentle' | 'standard' | 'firm' | 'final';
    template_name: string;
    subject: string;
    content: string;
  }): Promise<{
    template_updated: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/templates`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  }

  // ── Reminder Statistics & Analytics ───────────────────────────────────

  static async getReminderStats(params: {
    organization_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{
    total_reminders_sent: number;
    success_rate: number;
    stage_breakdown: Record<string, number>;
    response_rate: number;
    payment_conversion_rate: number;
    avg_days_to_payment: number;
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString();
    const endpoint = `/api/v1/admin/payment-reminders/stats${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  // ── Reminder Automation Control ───────────────────────────────────────

  static async getAutomationStatus(): Promise<{
    is_enabled: boolean;
    last_run_date: string;
    next_run_date: string;
    processed_count: number;
    error_count: number;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/automation/status`);
  }

  static async toggleAutomation(enabled: boolean): Promise<{
    automation_enabled: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/automation/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  static async triggerManualRun(): Promise<{
    task_started: boolean;
    task_id: string;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/automation/trigger`, {
      method: 'POST',
    });
  }

  // ── Organization-Specific Reminders ───────────────────────────────────

  static async getOrganizationReminderStatus(organizationId: string): Promise<{
    organization_id: string;
    organization_name: string;
    reminder_config: ReminderConfig | null;
    overdue_invoices: number;
    last_reminder_sent: string | null;
    next_reminder_due: string | null;
    total_reminders_sent: number;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/organizations/${organizationId}`);
  }

  static async pauseOrganizationReminders(
    organizationId: string,
    pause_until: string,
    reason?: string
  ): Promise<{
    paused: boolean;
    pause_until: string;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/organizations/${organizationId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ pause_until, reason }),
    });
  }

  static async resumeOrganizationReminders(organizationId: string): Promise<{
    resumed: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/admin/payment-reminders/organizations/${organizationId}/resume`, {
      method: 'POST',
    });
  }
}