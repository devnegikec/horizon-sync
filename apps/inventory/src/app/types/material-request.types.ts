/**
 * Material Request TypeScript types
 * Based on backend schemas from core-service/app/schemas/material_request.py
 */

export interface MaterialRequestLine {
  id: string;
  organization_id: string;
  material_request_id: string;
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRequest {
  id: string;
  organization_id: string;
  status: 'draft' | 'submitted' | 'partially_quoted' | 'fully_quoted' | 'cancelled';
  notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  line_items: MaterialRequestLine[];
}

export type MaterialRequestStatus = MaterialRequest['status'];

export interface MaterialRequestListItem {
  id: string;
  organization_id: string;
  status: string;
  created_at: string;
  created_by?: string;
  line_items_count: number;
}

export interface MaterialRequestLineCreate {
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
}

export interface CreateMaterialRequestPayload {
  notes?: string;
  line_items: MaterialRequestLineCreate[];
}

export interface UpdateMaterialRequestPayload {
  notes?: string;
  line_items?: MaterialRequestLineCreate[];
}

export interface MaterialRequestFilters {
  page?: number;
  page_size?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface MaterialRequestsResponse {
  material_requests: MaterialRequestListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
