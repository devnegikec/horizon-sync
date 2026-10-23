/** Customer-facing subscription/billing types — mirrors the deployed Core `/api/v1/account/*` schemas. */

export interface PlanSummary {
  id: string;
  code: string;
  name: string;
}

export interface PlanVersionSummary {
  id: string;
  version: number;
  billing_cadence: string;
  base_price: string;
  currency: string | null;
  tax_rate: string;
  included_credits: string;
  id_weight: string;
  effective_from: string | null;
}

export type SubscriptionStatus = 'draft' | 'pending_activation_payment' | 'active' | 'overdue' | 'suspended' | 'closed';

export interface AccountSubscription {
  organization_id: string;
  plan: PlanSummary;
  plan_version: PlanVersionSummary;
  status: SubscriptionStatus;
  billing_cadence: string;
  billing_anchor_day: number;
  billing_timezone: string;
  activation_fee: string;
  activation_fee_status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  next_invoice_date: string | null;
  renewal_date: string | null;
  id_weight: string;
  included_credits_per_period: string;
  payment_status: string;
  grace_until: string | null;
  can_top_up: boolean;
  activated_at: string | null;
  suspended_at: string | null;
  closed_at: string | null;
}

export interface EarliestExpiry {
  batch_id: string;
  expires_at: string;
  quantity: string;
}

export interface AccountCredits {
  available: string;
  reserved: string;
  used_this_period: string;
  expiring_30_days: string;
  expiring_60_days: string;
  expiring_90_days: string;
  earliest_expiry: EarliestExpiry | null;
  id_weight: string;
  estimated_ids_available: number;
  as_of: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface CreditBatch {
  id: string;
  source_type: string;
  source_ref: string | null;
  granted: string;
  remaining: string;
  issued_at: string;
  expires_at: string;
  status: string;
}

export interface CreditBatchListResponse {
  items: CreditBatch[];
  pagination: Pagination;
}

export interface CreditLedgerEntry {
  id: string;
  batch_id: string | null;
  type: string;
  qty: string;
  balance_after: string;
  operation_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  occurred_at: string;
}

export interface CreditLedgerListResponse {
  transactions: CreditLedgerEntry[];
  pagination: Pagination;
}

export interface ExpirationsResponse {
  buckets: {
    within_30_days: string;
    within_60_days: string;
    within_90_days: string;
  };
  timeline: Array<{
    batch_id: string;
    expires_at: string;
    quantity: string;
    source: string;
  }>;
}

export interface AccountInvoice {
  id: string;
  invoice_no: string;
  invoice_type: string;
  posting_date: string;
  due_date: string | null;
  status: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  outstanding_amount: string;
  currency: string;
  download_url: string | null;
}

export interface AccountInvoiceListResponse {
  items: AccountInvoice[];
  pagination: Pagination;
}

export interface TopupQuote {
  quote_id: string;
  credits: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  currency: string;
  expires_at: string;
  credit_expires_at: string;
}

/**
 * Options the backend must return when the order was created with the Razorpay
 * provider. `key_id` is public by design; the key secret never leaves the server.
 */
export interface RazorpayOrderOptions {
  key_id: string;
  order_id: string;
  /** Amount in the smallest currency subunit (integer paise for INR). */
  amount: number | string;
  currency: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export interface TopupOrder {
  order_id: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled';
  checkout_url: string | null;
  amount: string;
  currency: string;
  credits: string;
  provider?: string | null;
  /** Present when the backend created a Razorpay order for this top-up. */
  razorpay?: RazorpayOrderOptions | null;
}
