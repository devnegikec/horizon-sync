/** API item shape from core service GET /items */
export interface ApiItem {
  id: string;
  item_code: string;
  item_name: string;
  item_type: string;
  uom: string | null;
  item_group_id: string | null;
  item_group_name: string | null;
  standard_rate: string | null;
  status: string | null;
  maintain_stock: boolean | null;
  barcode: string | null;
  image_url: string | null;
  created_at: string | null;
}

export interface ItemsPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ItemsResponse {
  items: ApiItem[];
  pagination: ItemsPagination;
}

/** Payload for POST /items (create item) */
export interface CreateItemPayload {
  item_code: string;
  item_name: string;
  description: string;
  item_group_id: string;
  item_type: string;
  uom: string;
  maintain_stock: boolean;
  valuation_method: string;
  allow_negative_stock: boolean;
  has_variants: boolean;
  variant_of: string | null;
  variant_attributes: Record<string, unknown>;
  has_batch_no: boolean;
  has_serial_no: boolean;
  batch_number_series: string;
  serial_number_series: string;
  standard_rate: number;
  valuation_rate: number;
  enable_auto_reorder: boolean;
  reorder_level: number;
  reorder_qty: number;
  min_order_qty: number;
  max_order_qty: number;
  weight_per_unit: number;
  weight_uom: string;
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  barcode: string;
  status: string;
  image_url: string;
  images: string[];
  tags: string[];
  custom_fields: Record<string, unknown>;
  quality_inspection_template?: string | null;
  sales_tax_template_id?: string | null;
  purchase_tax_template_id?: string | null;
  extra_data?: Record<string, unknown>;
}

/** Item group snippet in update payload */
export interface UpdateItemGroupRef {
  id: string;
  code: string;
  name: string;
}

/** Payload for PUT /items/:id (update item) */
export interface UpdateItemPayload {
  organization_id?: string;
  item_code: string;
  item_name: string;
  description: string;
  item_group_id: string;
  item_group: UpdateItemGroupRef;
  item_type: string;
  uom: string;
  maintain_stock: boolean;
  valuation_method: string;
  allow_negative_stock: boolean;
  has_variants: boolean;
  variant_of: string | null;
  variant_attributes: Record<string, unknown>;
  has_batch_no: boolean;
  has_serial_no: boolean;
  batch_number_series: string;
  serial_number_series: string;
  standard_rate: string;
  valuation_rate: string;
  enable_auto_reorder: boolean;
  reorder_level: number;
  reorder_qty: number;
  min_order_qty: number;
  max_order_qty: number;
  weight_per_unit: string;
  weight_uom: string;
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  barcode: string;
  status: string;
  image_url: string;
  images: string[];
  tags: string[];
  custom_fields: Record<string, unknown>;
  quality_inspection_template?: string | null;
  sales_tax_template_id?: string | null;
  purchase_tax_template_id?: string | null;
  extra_data?: Record<string, unknown>;
}
