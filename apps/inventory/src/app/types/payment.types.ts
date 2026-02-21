/**
 * Payment Flow Type Definitions
 * 
 * TypeScript types matching backend payment schemas
 */

// Enums
export enum PaymentType {
  CUSTOMER_PAYMENT = 'Customer_Payment',
  SUPPLIER_PAYMENT = 'Supplier_Payment',
}

export enum PaymentMode {
  CASH = 'Cash',
  CHECK = 'Check',
  BANK_TRANSFER = 'Bank_Transfer',
}

export enum PaymentStatus {
  DRAFT = 'Draft',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
}

export enum PaymentSource {
  MANUAL = 'Manual',
  STRIPE = 'Stripe',
  RAZORPAY = 'Razorpay',
}

// Core Interfaces
export interface PaymentEntry {
  id: string;
  organization_id: string;
  payment_type: PaymentType;
  party_id: string;
  party_name?: string;
  amount: number;
  currency_code: string;
  payment_date: string;
  payment_mode: PaymentMode;
  reference_no?: string;
  status: PaymentStatus;
  source: PaymentSource;
  gateway_transaction_id?: string;
  receipt_number?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  unallocated_amount: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  payment_references?: PaymentReference[];
}

export interface PaymentReference {
  id: string;
  organization_id: string;
  payment_id: string;
  invoice_id: string;
  invoice_no?: string;
  allocated_amount: number;
  exchange_rate: number;
  allocated_amount_invoice_currency?: number;
  created_by: string;
  created_at: string;
}

// Request Payloads
export interface CreatePaymentPayload {
  payment_type: PaymentType;
  party_id: string;
  amount: number;
  currency_code: string;
  payment_date: string;
  payment_mode: PaymentMode;
  reference_no?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  currency_code?: string;
  payment_date?: string;
  payment_mode?: PaymentMode;
  reference_no?: string;
}

export interface AllocationCreate {
  invoice_id: string;
  allocated_amount: number;
}

export interface CancelPaymentPayload {
  cancellation_reason: string;
}

// Filters and Pagination
export interface PaymentFilters {
  status?: PaymentStatus;
  payment_mode?: PaymentMode;
  payment_type?: PaymentType;
  party_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  has_unallocated?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'payment_date' | 'amount' | 'party_name';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentsResponse {
  payment_entries: PaymentEntry[];
  pagination: PaginationMetadata;
}

// Batch Processing
export interface BatchProcessResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

// Invoice for Allocation
export interface InvoiceForAllocation {
  id: string;
  invoice_no: string;
  invoice_date: string;
  total_amount: number;
  balance_due: number;
  currency: string;
  status: string;
}
