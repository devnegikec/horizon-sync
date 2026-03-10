export interface DeliveryNoteItem {
  id: string;
  item: {
    id: string;
    name: string;
    code: string;
  };
  qty: string;
  uom: string;
  rate: string;
  amount: string;
  warehouse_id: string;
  batch_no: string | null;
  serial_nos: string[] | null;
  sort_order: number;
  extra_data: Record<string, unknown> | null;
  // Legacy field for backward compatibility
  item_id?: string;
}

export interface DeliveryNoteCustomer {
  customer_name: string;
  customer_code: string;
  phone: string | null;
  email: string | null;
}

export interface DeliveryNoteWarehouse {
  warehouse_name: string;
  warehouse_code: string;
}

export interface DeliveryNoteReference {
  id: string;
  reference_type: string;
  name: string;
  code: string;
}

// Legacy shape kept for backward compat with list view
export interface DeliveryNoteLineItem {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  item_image?: string | null;
  quantity_ordered: number;
  quantity_shipped: number;
  warehouse_location: string;
}

export interface DeliveryNoteTimelineEntry {
  id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  notes?: string;
}

export interface CustomerInfo {
  customer_code: string;
  customer_name: string;
}

export interface WarehouseInfo {
  warehouse_code: string;
  warehouse_name: string;
}

export interface DeliveryNote {
  id: string;
  organization_id: string;
  delivery_note_no: string;
  customer_id: string;
  customer?: DeliveryNoteCustomer;
  warehouse_id: string;
  warehouse?: DeliveryNoteWarehouse;
  pick_list_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference?: DeliveryNoteReference;
  delivery_date: string | null;
  submitted_at: string | null;
  status: 'draft' | 'submitted' | 'cancelled';
  remarks: string | null;
  items: DeliveryNoteItem[];
  // legacy fields (list view / older data)
  line_items?: DeliveryNoteLineItem[];
  timeline?: DeliveryNoteTimelineEntry[];
  // legacy logistics fields
  customer_name?: string;
  shipping_address?: string;
  contact_person?: string;
  contact_phone?: string;
  carrier_name?: string;
  tracking_number?: string;
  shipping_date?: string;
  sales_order_number?: string;
  total_weight?: number;
  total_packages?: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  extra_data?: Record<string, unknown> | null;
}

export interface DeliveryNoteResponse {
  delivery_notes: DeliveryNote[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export type DeliveryNoteStatus = DeliveryNote['status'];

export interface DeliveryNoteCreateItem {
  item_id: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse_id: string;
  batch_no: string;
  serial_nos: string[];
  sort_order: number;
}

export interface DeliveryNoteCreate {
  delivery_note_no: string;
  customer_id: string;
  delivery_date: string;
  status: DeliveryNoteStatus;
  warehouse_id: string;
  pick_list_id?: string;
  reference_type?: string;
  reference_id?: string;
  remarks?: string;
  items: DeliveryNoteCreateItem[];
}

export interface DeliveryNoteUpdate {
  delivery_date?: string;
  status?: DeliveryNoteStatus;
  warehouse_id?: string;
  remarks?: string;
}
