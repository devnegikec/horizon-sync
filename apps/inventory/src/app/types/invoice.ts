// Invoice Status Enum
export type InvoiceStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Paid' 
  | 'Partially Paid' 
  | 'Overdue' 
  | 'Cancelled';

// Invoice Type Enum
export type InvoiceType = 
  | 'Sales' 
  | 'Purchase' 
  | 'Debit Note' 
  | 'Credit Note';

// Party Type
export type PartyType = 'Customer' | 'Supplier';

// Payment Allocation (for linked payments in invoice)
export interface PaymentAllocation {
  id: string;
  invoice_id: string;
  invoice_number: string; // Populated from join
  invoice_date: string;
  invoice_amount: number;
  outstanding_before: number;
  allocated_amount: number;
}

// Invoice Line Item
export interface InvoiceLineItem {
  id: string;
  item_id: string;
  item_name: string; // Populated from join
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  tax_template_id: string | null;
  tax_rate: number;
  tax_amount: number;
  amount: number;
}

// Main Invoice Interface
export interface Invoice {
  id: string;
  invoice_number: string;
  party_id: string;
  party_type: PartyType;
  party_name: string; // Populated from join
  party_email?: string; // Populated from join (optional)
  posting_date: string; // ISO date
  due_date: string; // ISO date
  currency: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  total_tax: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  remarks: string | null;
  reference_type: string | null; // 'Sales Order'
  reference_id: string | null;
  line_items: InvoiceLineItem[];
  payments: PaymentAllocation[]; // Linked payments
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Invoice Line Item Form Data
export interface InvoiceLineItemFormData {
  item_id: string;
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  tax_template_id: string | null;
}

// Invoice Form Data
export interface InvoiceFormData {
  party_id: string;
  party_type: PartyType;
  posting_date: Date;
  due_date: Date;
  currency: string;
  invoice_type: InvoiceType;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  remarks: string;
  line_items: InvoiceLineItemFormData[];
}

// Invoice List Response (API response with pagination)
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

// Invoice Statistics
export interface InvoiceStats {
  total: number;
  draft: number;
  submitted: number;
  paid: number;
  overdue: number;
  total_outstanding: number;
}
