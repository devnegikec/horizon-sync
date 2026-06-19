import type { PaginationMeta } from './common.types';

/** Payload for creating a warehouse worker via Identity Service */
export interface AdminWorkerCreate {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  /** Unique QR code string (e.g. "WRK-A1B2C3D4E5F6"). Auto-generated if not provided. */
  qr_code?: string;
  organization_id: string;
}

/** Response from POST /identity/admin/create-worker */
export interface AdminWorkerCreateResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone: string | null;
  user_type: string;
  status: string;
  is_active: boolean;
  qr_code: string;
  organization_id: string;
  created_at: string;
}

/** Filters for listing warehouse workers */
export interface AdminWorkerFilters {
  search?: string;
  is_active?: boolean;
  user_type?: string;
  page?: number;
  page_size?: number;
}

/** A warehouse worker in the list view */
export interface AdminWorkerListItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  user_type: string;
  is_active: boolean;
  qr_code?: string;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
}

/** Paginated list response for workers */
export interface AdminWorkerListResponse {
  users: AdminWorkerListItem[];
  pagination: PaginationMeta;
}

/** Detail view for a single worker */
export interface AdminWorkerDetailResponse extends AdminWorkerCreateResponse {
  updated_at: string | null;
  organization_name?: string | null;
  roles?: string[];
}
