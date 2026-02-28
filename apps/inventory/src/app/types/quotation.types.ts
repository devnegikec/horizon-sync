export interface QuotationLineItem {
  id: string;
  quotation_id?: string;
  organization_id?: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  item_code?: string;
  qty: number | string;
  uom: string;
  rate: number | string;
  amount: number | string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number | string;
  discount_amount?: number | string;
  tax_template_id?: string | null;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
  sort_order: number;
  min_order_qty?: number;
  max_order_qty?: number;
  standard_rate?: string;
  stock_levels?: {
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
  };
  item_group?: {
    id: string;
    name: string;
    code: string;
  };
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
  } | null;
  created_at?: string;
  updated_at?: string;
  extra_data?: Record<string, unknown>;
}

export interface TableMeta {
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  deleteRow?: (rowIndex: number) => void;
  getItemData?: (itemId: string) => QuotationLineItem | undefined;
  searchItems?: (query: string) => Promise<QuotationLineItem[]>;
  itemLabelFormatter?: (item: QuotationLineItem) => string;
  disabled?: boolean;
  currency?: string;
}

export interface PickerResponse {
  items: QuotationLineItem[];
}

export interface DocumentDiscountControls {
  type: 'flat' | 'percentage';
  value: string;
  onTypeChange: (value: string) => void;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export interface QuotationSummary {
  /** Sum of line amounts (qty × rate) */
  subtotalAmount: number;
  /** Sum of line tax amounts */
  subtotalTax: number;
  /** Sum of line totals (before document-level discount) */
  subtotalTotal: number;
  /** Sum of line-level discount amounts */
  subtotalLineDiscount: number;
  /** Document-level discount amount (computed) */
  discountAmount: number;
  /** After document discount */
  grandTotal: number;
  /** When provided, discount-on-total dropdown + input are rendered in the footer Discount column */
  documentDiscount?: DocumentDiscountControls;
}

export interface QuotationLineItemsTableProps {
  items: QuotationLineItemCreate[];
  onItemsChange: (items: QuotationLineItemCreate[]) => void;
  disabled?: boolean;
  currency?: string;
  /** When provided, footer rows (Subtotal, Discount, Grand Total) are shown aligned with table columns */
  summary?: QuotationSummary;
}

export interface CustomerInfo {
  code: string;
  name: string;
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

export interface Quotation {
  id: string;
  quotation_no: string;
  organization_id: string;
  customer_id: string;
  customer_name?: string;
  customer?: CustomerInfo;
  quotation_date: string;
  valid_until: string;
  grand_total: string;
  currency: string;
  status: QuotationStatus;
  remarks?: string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number | string;
  discount_amount?: number | string;
  line_items?: QuotationLineItem[];
  items?: QuotationLineItem[]; // API returns 'items' instead of 'line_items'
  converted_to_sales_order?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  extra_data?: Record<string, unknown>;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuotationResponse {
  quotations: Quotation[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface QuotationLineItemCreate {
  item_id: string;
  qty: number | string;
  uom: string;
  rate: number | string;
  amount: number | string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number | string;
  discount_amount?: number | string;
  tax_template_id?: string | null;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
  sort_order: number;
}

export interface QuotationCreate {
  quotation_no?: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status?: QuotationStatus;
  grand_total?: number;
  currency: string;
  remarks?: string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  items: QuotationLineItemCreate[];
}

export interface QuotationUpdate {
  quotation_date?: string;
  valid_until?: string;
  status?: QuotationStatus;
  remarks?: string;
  discount_type?: 'flat' | 'percentage';
  discount_value?: number;
  discount_amount?: number;
  items?: QuotationLineItemCreate[];
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface QuotationFormState {
  quotation_no: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  currency: string;
  status: QuotationStatus;
  remarks: string;
  discount_type: 'flat' | 'percentage';
  discount_value: string;
}

export interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onSave: (data: QuotationCreate | QuotationUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

export interface ServerPaginationConfig {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
}
