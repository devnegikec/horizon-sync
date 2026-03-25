export interface BrandCreate {
  name: string;
  short_code: string;
}

export interface BrandUpdate {
  name?: string;
  short_code?: string;
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  short_code: string;
  public_key: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandListResponse {
  brands: Brand[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
