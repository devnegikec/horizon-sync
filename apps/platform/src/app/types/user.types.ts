export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  user_type: string;
  status: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  avatar_url?: string | null;
  phone?: string | null;
  mfa_enabled?: boolean;
  /** Org-level role names assigned to this user (e.g. ["Sales Agent", "Viewer"]) */
  roles?: string[];
  /** Extra data from invitation (warehouse_ids, warehouse_role, etc.) */
  extra_data?: Record<string, unknown> | null;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  status_counts: {
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
    mfa_enabled: number;
  };
}

export interface UserFilters {
  search: string;
  status: string;
  /** Org-level role name filter (e.g. "Sales Agent"). Empty string = all. */
  roleName: string;
}
