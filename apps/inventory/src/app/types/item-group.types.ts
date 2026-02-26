export interface ItemGroup {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string | null;
  parent_id: string | null;
  parent?: { id: string; name: string; code: string } | null;
  default_valuation_method: string | null;
  default_uom: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemGroupListItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parent_id: string | null;
  default_valuation_method: string | null;
  default_uom: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ItemGroupListResponse {
  item_groups: ItemGroupListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ItemGroupCreate {
  name: string;
  code?: string;
  description?: string | null;
  parent_id?: string | null;
  default_valuation_method?: string | null;
  default_uom?: string | null;
  is_active?: boolean;
}

export interface ItemGroupUpdate {
  name?: string;
  code?: string;
  description?: string | null;
  parent_id?: string | null;
  default_valuation_method?: string | null;
  default_uom?: string | null;
  is_active?: boolean;
}

export interface ItemGroupFilters {
  search: string;
  status: string;
}
