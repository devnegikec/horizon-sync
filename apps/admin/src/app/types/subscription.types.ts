import type { PaginationMeta } from './common.types';

/** Billing cadence supported by a plan version. */
export type BillingCadence = 'monthly' | 'quarterly' | 'annually';

/** Lifecycle of an immutable plan version. */
export type PlanVersionStatus = 'draft' | 'approved' | 'published' | 'retired';

/** Lifecycle of an organization subscription (mirrors organization_subscriptions.status). */
export type SubscriptionStatus = 'draft' | 'pending_activation_payment' | 'active' | 'overdue' | 'suspended' | 'closed';

export type ActivationFeeStatus = 'not_required' | 'pending' | 'paid';

export type AdjustmentDirection = 'adjust_positive' | 'adjust_negative';

/** All decimals arrive as strings — never parse them into floats for math. */
export interface SubscriptionPlanVersion {
  id: string;
  plan_id?: string;
  version: number;
  billing_cadence: BillingCadence;
  base_price: string;
  /** Present on the org-subscription contract snapshot. */
  currency?: string;
  tax_rate: string;
  included_credits: string;
  id_weight: string;
  topup_allowed: boolean;
  effective_from: string;
  effective_to: string | null;
  status: PlanVersionStatus;
  approved_by: string | null;
  approved_at?: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  organization_name: string | null;
  currency: string;
  is_active: boolean;
  published_version: SubscriptionPlanVersion | null;
  draft_version_count: number;
  created_at?: string;
  updated_at?: string | null;
}

export interface SubscriptionPlanDetail extends SubscriptionPlan {
  versions: SubscriptionPlanVersion[];
}

export interface SubscriptionPlanListResponse {
  items: SubscriptionPlan[];
  pagination: PaginationMeta;
}

export interface SubscriptionPlanListFilters {
  q?: string;
  active?: boolean;
  organization_id?: string;
  billing_cadence?: BillingCadence;
  page?: number;
  page_size?: number;
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  description?: string | null;
  currency: string;
  organization_id?: string | null;
}

export interface PlanVersionPayload {
  billing_cadence: BillingCadence;
  base_price: string;
  tax_rate: string;
  included_credits: string;
  id_weight: string;
  topup_allowed: boolean;
  effective_from?: string;
}

export interface CreateSubscriptionPayload {
  plan_version_id: string;
  billing_anchor_day: number;
  billing_timezone: string;
  activation_fee: string;
  activation_fee_required: boolean;
}

export interface OrganizationSubscription {
  organization_id: string;
  organization_name?: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
  } | null;
  plan_version: SubscriptionPlanVersion | null;
  status: SubscriptionStatus;
  billing_cadence?: BillingCadence;
  billing_anchor_day: number | null;
  billing_timezone: string | null;
  activation_fee: string | null;
  activation_fee_status: ActivationFeeStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  next_invoice_date: string | null;
  activated_at: string | null;
  suspended_at?: string | null;
  closed_at?: string | null;
}

export interface ChangeSubscriptionPayload {
  plan_version_id?: string;
  billing_anchor_day?: number;
  effective_from?: string;
  reason: string;
}

export interface CreditExposureItem {
  organization_id: string;
  organization_name: string;
  subscription_status: SubscriptionStatus | null;
  available: string;
  reserved: string;
  expiring_30_days: string;
  earliest_expiry: string | null;
  overdue_invoices: number;
  outstanding_amount: string;
}

export interface CreditExposureTotals {
  organizations: number;
  available: string;
  expiring_30_days: string;
}

export interface CreditExposureResponse {
  items: CreditExposureItem[];
  totals: CreditExposureTotals;
  pagination?: PaginationMeta;
}

export type ReconciliationIssue =
  | 'paid_invoice_without_grant'
  | 'grant_without_payment'
  | 'batch_sum_mismatch'
  | 'duplicate_grant'
  | 'stuck_reservation'
  | 'expired_batch_consumed';

export interface ReconciliationRow {
  id?: string;
  issue: ReconciliationIssue;
  organization_id: string;
  organization_name?: string | null;
  invoice_id?: string | null;
  payment_id?: string | null;
  batch_id?: string | null;
  operation_id?: string | null;
  amount?: string | null;
  quantity?: string | null;
  detected_at?: string | null;
  detail?: string | null;
}

export interface ReconciliationResponse {
  items: ReconciliationRow[];
  generated_at?: string;
  pagination?: PaginationMeta;
}

export interface CreditAdjustmentPayload {
  organization_id: string;
  direction: AdjustmentDirection;
  quantity: string;
  expires_at?: string | null;
  reason: string;
  approval_id?: string | null;
}

export type CreditBatchSource = 'invoice_plan' | 'topup' | 'activation' | 'legacy_balance' | 'promo' | 'adjustment';

export interface CreditBatch {
  id: string;
  organization_id?: string;
  source_type: CreditBatchSource;
  source_id?: string | null;
  granted_qty: string;
  consumed_qty?: string;
  reserved_qty?: string;
  expired_qty?: string;
  reversed_qty?: string;
  available_qty?: string;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'exhausted' | 'expired';
}

export interface CreditBatchListResponse {
  items: CreditBatch[];
  pagination?: PaginationMeta;
}

export interface OrganizationCreditBalance {
  balance_credits: number;
  reserved_credits?: number;
  organization_id?: string;
}

export interface CreditLedgerEntry {
  id: string;
  transaction_type: string;
  amount: number | string;
  balance_after: number | string;
  reason: string | null;
  created_at: string;
  created_by?: string | null;
}
