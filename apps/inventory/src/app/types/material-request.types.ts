// Material Request Types based on sourcing-flow spec

export type MaterialRequestStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'PARTIALLY_QUOTED' 
  | 'FULLY_QUOTED' 
  | 'CANCELLED';

export interface MaterialRequestLine {
  id: string;
  material_request_id: string;
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
}

export interface MaterialRequest {
  id: string;
  status: MaterialRequestStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  notes?: string;
  line_items: MaterialRequestLine[];
  line_items_count?: number; // Count from list endpoint
}

export interface CreateMaterialRequestPayload {
  notes?: string;
  line_items: Omit<MaterialRequestLine, 'id' | 'material_request_id'>[];
}

export interface UpdateMaterialRequestPayload {
  notes?: string;
  line_items?: Omit<MaterialRequestLine, 'id' | 'material_request_id'>[];
}

export interface MaterialRequestListResponse {
  data: MaterialRequest[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface MaterialRequestFilters {
  status: MaterialRequestStatus | 'all';
  search: string;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
