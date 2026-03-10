import type { PaginationInfo } from './quotation.types';

export type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'partially_delivered'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export interface SalesOrderLineItem {
  id: string;
  organization_id: string;
  sales_order_id: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  qty: number;
  uom: string;
  rate: number | string;
  amount: number | string;
  sort_order: number;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number | string;
  discount_amount?: number | string;
  billed_qty: number | string;
  delivered_qty: number | string;
  pending_billing_qty: number | string;
  pending_delivery_qty: number | string;
  created_at: string;
  updated_at: string;
  extra_data?: Record<string, unknown>;
  tax_info?: {
    id: string;
    template_name: string;
    template_code: string;
    is_compound: boolean;
    breakup: Array<{
      rule_name: string;
      tax_type: string;
      rate: number;
      is_compound: boolean;
    }>;
  };
  tax_amount?: number;
  total_amount?: number;
}

export interface CustomerDetails {
  id?: string;
  name?: string;
  code?: string;
  customer_name?: string;
  customer_code?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_number?: string;
}

export interface SalesOrder {
  id: string;
  organization_id: string;
  sales_order_no: string;
  customer_id: string;
  customer_name?: string;
  order_date: string;
  delivery_date?: string | null;
  grand_total: string | number;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number | string;
  discount_amount?: number | string;
  currency: string;
  status: SalesOrderStatus;
  reference_type?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
  items: SalesOrderLineItem[];
  submitted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  extra_data?: Record<string, unknown>;
  customer?: CustomerDetails;
}

export interface SalesOrderListItem {
  id: string;
  organization_id: string;
  sales_order_no: string;
  customer_id: string;
  customer_name?: string;
  status: string;
  order_date: string;
  grand_total: string;
  created_at: string;
}

export interface SalesOrderListResponse {
  sales_orders: SalesOrderListItem[];
  pagination: PaginationInfo;
}

export interface SalesOrderItemCreate {
  item_id: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  sort_order: number;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  tax_template_id?: string | null;
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface SalesOrderCreate {
  sales_order_no?: string;
  customer_id: string;
  order_date: string;
  delivery_date?: string | null;
  status?: SalesOrderStatus;
  grand_total?: number;
  currency?: string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  reference_type?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
  items: SalesOrderItemCreate[];
}

export interface SalesOrderUpdate {
  order_date?: string | null;
  delivery_date?: string | null;
  status?: SalesOrderStatus | null;
  remarks?: string | null;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  items?: SalesOrderItemCreate[] | null;
}

export interface SalesOrderStatusUpdate {
  status: SalesOrderStatus;
}

export interface SalesOrderResponse extends SalesOrder {}

// Convert to Invoice types
export interface ConvertToInvoiceItemRequest {
  item_id: string;
  qty_to_bill: number;
}

export interface ConvertToInvoiceRequest {
  items: ConvertToInvoiceItemRequest[];
}

export interface ConvertToInvoiceResponse {
  invoice_id: string;
  invoice_no: string;
  message: string;
}

// Convert to Delivery Note types
export interface ConvertToDeliveryNoteItemRequest {
  item_id: string;
  qty_to_deliver: number;
}

export interface ConvertToDeliveryNoteRequest {
  items: ConvertToDeliveryNoteItemRequest[];
}

export interface ConvertToDeliveryNoteResponse {
  delivery_note_id: string;
  delivery_note_no: string;
  message: string;
}

// Convert from Quotation types
export interface ConvertToSalesOrderResponse {
  sales_order_id: string;
  sales_order_no: string;
  message: string;
}
