/** API item shape from core service GET /items */
export interface ApiItem {
  id: string;
  item_code: string;
  item_name: string;
  item_type: string;
  uom: string | null;
  item_group_id: string | null;
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
