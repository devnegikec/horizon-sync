// B2B Billing System Types

// Regular Invoice Types (for admin portal)
export interface InvoiceCreateRequest {
  party_id: string;
  party_type: 'Customer' | 'Supplier' | 'customer' | 'supplier';
  posting_date: string;
  due_date: string;
  currency: string;
  invoice_type: 'Sales' | 'Purchase' | 'sales' | 'purchase';
  status: 'Draft' | 'Submitted' | 'Cancelled' | 'draft' | 'submitted' | 'cancelled';
  remarks?: string;
  grand_total: number;
  outstanding_amount: number;
  line_items: InvoiceLineItemRequest[];
}

export interface InvoiceLineItemRequest {
  item_id: string;
  description: string;
  quantity: number;
  uom?: string;
  rate: number;
  tax_template_id?: string | null;
}

// B2B Subscription Invoice Types
export interface SubscriptionInvoiceCreateRequest {
  organization_id: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  seat_count: number;
  credit_usage?: number;
  base_price_per_seat?: number;
  credit_rate?: number;
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface SubscriptionInvoiceResponse {
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

export interface OrganizationBillingInfo {
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

export interface BillingSummary {
  total_organizations: number;
  total_invoices: number;
  total_outstanding: number;
  total_paid: number;
  overdue_invoices: number;
  current_month_revenue: number;
}

export interface PaymentCreateRequest {
  payment_amount: number;
  payment_method: string;
  payment_date?: string;
  notes?: string;
}

export interface PaymentResponse {
  payment_id: string;
  success: boolean;
  message: string;
}

export interface TierUpdateRequest {
  new_tier: 'basic' | 'pro' | 'enterprise';
  effective_date?: string;
  prorated?: boolean;
  reason?: string;
}

export interface TierUpdateResponse {
  success: boolean;
  message: string;
  invoice_id?: string;
}

// Organization Deactivation Types
export interface DeactivationActionResponse {
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

export interface DeactivationSummaryResponse {
  total_organizations: number;
  trial_expired_count: number;
  subscription_expired_count: number;
  overdue_payment_count: number;
  suspended_count: number;
  cancelled_count: number;
  last_check_date?: string;
  actions_pending: DeactivationActionResponse[];
}

export interface OrganizationStatusResponse {
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

export interface ReactivationResponse {
  organization_id: string;
  organization_name: string;
  previous_status: string;
  new_status: string;
  reactivation_date: string;
  new_subscription_end_date: string;
  reactivated_by: string;
  reactivation_notes?: string;
}

export interface ExpireTrialRequest {
  reason?: string;
  send_notification?: boolean;
}

export interface ExpireSubscriptionRequest {
  reason?: string;
  send_notification?: boolean;
}

export interface SuspendOrganizationRequest {
  days_overdue: number;
  suspension_reason?: string;
  send_notification?: boolean;
}

export interface CancelSubscriptionRequest {
  cancellation_reason: string;
  effective_date?: string;
  grace_period_days?: number;
  send_notification?: boolean;
}

export interface ReactivateOrganizationRequest {
  new_subscription_end_date: string;
  reactivation_notes?: string;
  send_notification?: boolean;
}

export interface OrganizationsRequiringActionResponse {
  trial_expired: Array<{ organization_id: string; organization_name: string; days_expired: number }>;
  subscription_expired: Array<{ organization_id: string; organization_name: string; days_expired: number }>;
  payment_overdue: Array<{ organization_id: string; organization_name: string; days_overdue: number; amount_due: number }>;
}

// System Admin Permission Types
export interface SystemAdminPermission {
  permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
  description: string;
  allowed_organizations?: string[];
  permission_scope: 'all' | 'specific';
}

export interface SystemAdminUser {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  permissions: SystemAdminPermission[];
  assigned_by: string;
  assigned_date: string;
  last_active?: string;
}

export interface AssignSystemAdminRequest {
  user_id: string;
  permissions: Array<{
    permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
    allowed_organizations?: string[];
  }>;
  notes?: string;
}

export interface UpdateSystemAdminRequest {
  permissions: Array<{
    permission_type: 'master' | 'user_manager' | 'org_manager' | 'billing' | 'reporting';
    allowed_organizations?: string[];
  }>;
  notes?: string;
}

export interface OrganizationAccessInfo {
  organization_id: string;
  organization_name: string;
  access_type: 'full' | 'billing_only' | 'reporting_only';
  granted_by: string;
  granted_date: string;
}

export interface SystemAdminAuditLog {
  action_id: string;
  action_type: 'assign' | 'update' | 'revoke' | 'access_grant' | 'access_revoke';
  admin_user_id: string;
  admin_username: string;
  target_user_id?: string;
  target_username?: string;
  target_organization_id?: string;
  target_organization_name?: string;
  changes_made: Record<string, unknown>;
  performed_by: string;
  performed_date: string;
  notes?: string;
}

export interface PermissionType {
  type: string;
  label: string;
  description: string;
  scope_required: boolean;
}

export interface OrganizationAccessRequest {
  user_id: string;
  organization_id: string;
  access_type: 'full' | 'billing_only' | 'reporting_only';
  notes?: string;
}

export interface OrganizationAccessCheck {
  has_access: boolean;
  access_type?: string;
  permissions: string[];
}

// Extended Invoice Types for Admin Pages
export interface Invoice {
  id: string;
  invoice_no: string;
  organization_id: string;
  organization_name?: string;
  invoice_type: string;
  party_id: string;
  party_name?: string;
  party_code?: string;
  status: string;
  posting_date: string;
  due_date?: string;
  grand_total: number;
  outstanding_amount?: number;
  created_at: string;

  // Subscription billing fields
  billing_cycle?: string;
  subscription_period_start?: string;
  subscription_period_end?: string;
  seat_count?: number;
  credit_usage?: number;

  // Additional optional fields for compatibility
  invoice_number?: string; // alias for invoice_no
  total_amount?: number; // alias for grand_total
  issue_date?: string; // alias for posting_date
  subscription_tier?: 'basic' | 'pro' | 'enterprise';
  paid_date?: string;
  description?: string;
  updated_at?: string;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Payment Types for Admin Pages
export interface Payment {
  id: string;
  transaction_id?: string;
  organization_id: string;
  organization_name?: string;
  invoice_id?: string;
  amount: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'cash' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_date: string;
  processor_reference?: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  payments: Payment[];
  page: number;
  total_pages: number;
  total_count: number;
  page_size: number;
}

// Payment Reminder Types
export interface ReminderConfig {
  id: string;
  organization_id?: string;
  organization_name?: string;
  reminder_type?: 'manual' | 'auto' | 'configured';
  is_enabled: boolean;
  grace_period_days: number;
  first_reminder_days: number;
  second_reminder_days: number;
  final_notice_days: number;
  auto_deactivate_days?: number;
  reminder_frequency_days: number;
  max_reminders_per_stage: number;
  escalation_sequence?: string[];
  first_reminder_template?: string;
  second_reminder_template?: string;
  final_notice_template?: string;
  deactivation_notice_template?: string;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility
  escalation_days?: number;
  max_reminder_count?: number;
  auto_deactivate?: boolean;
  template_gentle?: string;
  template_standard?: string;
  template_firm?: string;
  template_final?: string;
}

export interface ReminderLog {
  id: string;
  config_id: string;
  organization_id: string;
  organization_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  recipient_name?: string;
  recipient_email: string;
  invoice_amount?: number;
  outstanding_amount?: number;
  days_overdue?: number;
  due_date?: string;
  subject?: string;
  reminder_stage: 'gentle' | 'standard' | 'firm' | 'final';
  reminder_type?: string;
  retry_count?: number;
  triggered_by?: string;
  status: 'sent' | 'pending' | 'failed';
  sent_at: string;
  error_message?: string;
  created_at: string;
}

export interface ReminderConfigCreateRequest {
  organization_id: string;
  reminder_type?: 'manual' | 'auto' | 'configured';
  grace_period_days?: number;
  first_reminder_days?: number;
  second_reminder_days?: number;
  final_notice_days?: number;
  auto_deactivate_days?: number;
  reminder_frequency_days?: number;
  max_reminders_per_stage?: number;
  is_enabled?: boolean;
  first_reminder_template?: string;
  second_reminder_template?: string;
  final_notice_template?: string;
  deactivation_notice_template?: string;
}

// Shared Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// Admin Invoice Filters
export interface AdminInvoiceFilters {
  search?: string;
  status?: string;
  organization_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}