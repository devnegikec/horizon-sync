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
  userType: string;
}
