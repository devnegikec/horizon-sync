import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

// Types for Billing Management
interface SubscriptionInvoiceCreateRequest {
  organization_id: string;
  master_organization_id?: string;
  invoice_type: 'subscription' | 'setup_fee' | 'overage' | 'addon' | 'credit_adjustment';
  subscription_tier: 'basic' | 'pro' | 'enterprise';
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  due_date: string;
  description?: string;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

interface SubscriptionInvoiceResponse {
  id: string;
  invoice_number: string;
  organization_id: string;
  master_organization_id?: string;
  invoice_type: string;
  subscription_tier: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  status: string;
  due_date: string;
  created_date: string;
  paid_date?: string;
  description?: string;
  line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

interface OrganizationBillingInfo {
  organization_id: string;
  organization_name: string;
  master_organization_id?: string;
  subscription_tier: string;
  billing_cycle: string;
  next_billing_date: string;
  total_outstanding: number;
  total_paid: number;
  invoice_count: number;
  last_payment_date?: string;
}

export class BillingManagementService {
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

  // Create subscription invoice
  static async createSubscriptionInvoice(
    request: SubscriptionInvoiceCreateRequest
  ): Promise<SubscriptionInvoiceResponse> {
    return this.request<SubscriptionInvoiceResponse>(
      '/api/v1/admin/billing/subscription-invoice',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  // Get all subscription invoices with filtering - Use admin invoices endpoint
  static async getSubscriptionInvoices(params?: {
    organization_id?: string;
    master_organization_id?: string;
    invoice_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    invoices: SubscriptionInvoiceResponse[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          // Map start_date/end_date to date_from/date_to for backend compatibility
          if (key === 'start_date') {
            queryParams.append('date_from', value.toString());
          } else if (key === 'end_date') {
            queryParams.append('date_to', value.toString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const endpoint = queryParams.size > 0
      ? `/api/v1/admin/invoices?${queryParams.toString()}`
      : '/api/v1/admin/invoices';

    return this.request(endpoint);
  }

  // Get specific subscription invoice - Use admin invoices endpoint
  static async getSubscriptionInvoice(invoiceId: string): Promise<SubscriptionInvoiceResponse> {
    return this.request<SubscriptionInvoiceResponse>(
      `/api/v1/admin/invoices/${invoiceId}`
    );
  }

  // Update subscription invoice - Use admin invoices endpoint
  static async updateSubscriptionInvoice(
    invoiceId: string,
    updates: Partial<SubscriptionInvoiceCreateRequest>
  ): Promise<SubscriptionInvoiceResponse> {
    return this.request<SubscriptionInvoiceResponse>(
      `/api/v1/admin/invoices/${invoiceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  }

  // Mark invoice as sent - Use admin invoices endpoint
  static async markInvoiceAsSent(invoiceId: string): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/admin/invoices/${invoiceId}/confirm`,
      { method: 'POST' }
    );
  }

  // Mark invoice as paid - Use admin invoices endpoint
  static async markInvoiceAsPaid(
    invoiceId: string,
    paymentData: {
      payment_date: string;
      payment_method?: string;
      transaction_id?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/admin/invoices/${invoiceId}/create-payment`,
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
  }

  // Get billing summary for all organizations
  static async getBillingSummary(): Promise<{
    total_organizations: number;
    total_invoices: number;
    total_outstanding: number;
    total_paid: number;
    overdue_invoices: number;
    current_month_revenue: number;
  }> {
    return this.request('/api/v1/admin/billing/summary');
  }

  // Get organization billing information - Use customer-organizations endpoint
  static async getOrganizationBilling(params?: {
    master_organization_only?: boolean;
    has_outstanding?: boolean;
    subscription_tier?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    organizations: OrganizationBillingInfo[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          // Map parameters to backend-compatible format
          if (key === 'master_organization_only') {
            queryParams.append('billing_status', 'active');
          } else if (key === 'has_outstanding') {
            queryParams.append('has_outstanding', value.toString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
    }

    const endpoint = queryParams.size > 0
      ? `/api/v1/admin/billing/customer-organizations?${queryParams.toString()}`
      : '/api/v1/admin/billing/customer-organizations';

    return this.request(endpoint);
  }

  // Create payment from invoice - Use admin invoices endpoint
  static async createPaymentFromInvoice(
    invoiceId: string,
    paymentData: {
      payment_amount: number;
      payment_method: string;
      payment_date?: string;
      notes?: string;
    }
  ): Promise<{ payment_id: string; success: boolean; message: string }> {
    return this.request(
      `/api/v1/admin/invoices/${invoiceId}/create-payment`,
      {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }
    );
  }

  // Update organization subscription tier
  static async updateOrganizationTier(
    organizationId: string,
    tierData: {
      new_tier: 'basic' | 'pro' | 'enterprise';
      effective_date?: string;
      prorated?: boolean;
      reason?: string;
    }
  ): Promise<{ success: boolean; message: string; invoice_id?: string }> {
    return this.request(
      `/api/v1/admin/billing/organizations/${organizationId}/update-tier`,
      {
        method: 'POST',
        body: JSON.stringify(tierData),
      }
    );
  }
}