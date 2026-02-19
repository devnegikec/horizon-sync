/**
 * Material Request TypeScript types
 * Based on backend schemas from core-service/app/schemas/material_request.py
 */

export type MaterialRequestType = 'purchase' | 'transfer' | 'issue';
export type MaterialRequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaterialRequestStatus = 'draft' | 'submitted' | 'partially_quoted' | 'fully_quoted' | 'cancelled';

export interface MaterialRequestLine {
  id?: string;
  item_id: string;
  quantity: number;
  uom: string | null;
  required_date: string;
  description: string | null;
  estimated_unit_cost: number | null;
  requested_for: string | null;
  requested_for_department: string | null;
}

export interface MaterialRequestLineResponse extends MaterialRequestLine {
  id: string;
  organization_id: string;
  material_request_id: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialRequest {
  id: string;
  organization_id: string;
  request_no: string;
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  status: MaterialRequestStatus;
  target_warehouse_id: string | null;
  requested_by: string | null;
  department: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  line_items: MaterialRequestLineResponse[];
}

export interface MaterialRequestListItem {
  id: string;
  organization_id: string;
  request_no: string;
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  status: MaterialRequestStatus;
  department: string | null;
  created_at: string;
  created_by: string | null;
  line_items_count: number;
}

export interface MaterialRequestLineCreate {
  item_id: string;
  quantity: number;
  uom: string | null;
  required_date: string;
  description: string | null;
  estimated_unit_cost: number | null;
  requested_for: string | null;
  requested_for_department: string | null;
}

export interface CreateMaterialRequestPayload {
  request_no?: string;
  type: MaterialRequestType;
  priority: MaterialRequestPriority;
  target_warehouse_id?: string | null;
  requested_by?: string | null;
  department?: string | null;
  notes?: string | null;
  line_items: MaterialRequestLineCreate[];
}

export interface UpdateMaterialRequestPayload {
  request_no?: string;
  type?: MaterialRequestType;
  priority?: MaterialRequestPriority;
  target_warehouse_id?: string | null;
  requested_by?: string | null;
  department?: string | null;
  notes?: string | null;
  line_items?: MaterialRequestLineCreate[];
}

export interface MaterialRequestFilters {
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
  priority?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface MaterialRequestListResponse {
  material_requests: MaterialRequestListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Legacy alias for backward compatibility
export type MaterialRequestsResponse = MaterialRequestListResponse;
