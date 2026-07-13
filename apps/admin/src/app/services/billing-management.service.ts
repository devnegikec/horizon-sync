import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

// Types for Billing Management - Updated to match backend API
interface SubscriptionInvoiceCreateRequest {
  organization_id: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  seat_count: number;
  credit_usage?: number;
  base_price_per_seat?: number;
  credit_rate?: number;
}

interface SubscriptionInvoiceResponse {
  id: string;
  invoice_number: string;
  organization_id: string;
  billing_cycle: string;
  seat_count: number;
  credit_usage?: number;
  base_price_per_seat: number;
  credit_rate?: number;
  subscription_start_date?: string;
  amount: number;
  status: string;
  created_date: string;
  paid_date?: string;
  notes?: string;
  custom_line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

interface OrganizationBillingInfo {
  organization_id: string;
  organization_name: string;
  billing_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  seat_limit: number | null;
  credit_limit: number | null;
  billing_contact_email: string | null;
  billing_cycle: string | null;
  customer_since: string | null;
  last_billed_date: string | null;
  next_billing_date: string | null;
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
      `/api/v1/admin/invoices/${invoiceId}/send`,
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
      `/api/v1/admin/invoices/${invoiceId}/mark-paid`,
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
    organization_name?: string;
    page?: number;
    page_size?: number;
  }): Promise<OrganizationBillingInfo[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = queryParams.size > 0
      ? `/api/v1/admin/billing/customer-organizations?${queryParams.toString()}`
      : '/api/v1/admin/billing/customer-organizations';

    return this.request<OrganizationBillingInfo[]>(endpoint);
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