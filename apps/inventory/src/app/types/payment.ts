// Payment Status Enum
export type PaymentStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Reconciled' 
  | 'Cancelled';

// Payment Mode Enum
export type PaymentMode = 
  | 'Cash' 
  | 'Bank Transfer' 
  | 'Credit Card' 
  | 'Check' 
  | 'Other';

// Party Type (shared with invoices)
export type PartyType = 'Customer' | 'Supplier';

// Payment Allocation (for allocating payment to invoices)
export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  invoice_number: string; // Populated from join
  invoice_date: string;
  invoice_amount: number;
  outstanding_before: number;
  allocated_amount: number;
}

// Main Payment Interface
export interface Payment {
  id: string;
  payment_number: string;
  party_id: string;
  party_type: PartyType;
  party_name: string; // Populated from join
  payment_date: string; // ISO date
  payment_mode: PaymentMode;
  reference_number: string | null;
  currency: string;
  total_amount: number;
  allocated_amount: number;
  unallocated_amount: number;
  status: PaymentStatus;
  remarks: string | null;
  allocations: PaymentAllocation[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Payment Allocation Form Data
export interface PaymentAllocationFormData {
  invoice_id: string;
  allocated_amount: number;
}

// Payment Form Data
export interface PaymentFormData {
  party_id: string;
  party_type: PartyType;
  payment_date: Date;
  payment_mode: PaymentMode;
  reference_number: string;
  currency: string;
  total_amount: number;
  status: 'Draft' | 'Submitted';
  remarks: string;
  allocations: PaymentAllocationFormData[];
}

// Payment List Response (API response with pagination)
export interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Payment Statistics
export interface PaymentStats {
  total: number;
  pending: number;
  completed: number;
  total_amount: number;
}

// Outstanding Invoice (for payment allocation)
export interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  currency: string;
}
