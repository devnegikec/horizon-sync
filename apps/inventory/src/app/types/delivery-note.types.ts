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

export interface DeliveryNote {
  id: string;
  delivery_note_number: string;
  customer_id: string;
  customer_name: string;
  shipping_address: string;
  contact_person: string;
  contact_phone: string;
  carrier_name: string;
  tracking_number: string;
  shipping_date: string;
  delivery_date: string | null;
  sales_order_number: string;
  total_weight: number;
  total_packages: number;
  status: 'draft' | 'submitted' | 'cancelled';
  line_items: DeliveryNoteLineItem[];
  timeline: DeliveryNoteTimelineEntry[];
  created_at: string;
  updated_at: string;
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
