import type { PaginationMeta } from './common.types';

export type AllowedRole = 'system_admin' | 'org_admin' | 'user';
export type UserType = 'system_admin' | 'organization_admin' | 'user' | 'guest';

export interface AdminUserListItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  roles: string[];
  user_type: string;
  is_active: boolean;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
}

export interface AdminUserDetailResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone: string | null;
  roles: string[];
  user_type: string;
  is_active: boolean;
  organization_id: string | null;
  organization_name: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AdminUserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  roles?: AllowedRole[];
  phone?: string | null;
  user_type?: UserType;
}

export interface AdminUserUpdate {
  roles?: AllowedRole[];
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  user_type?: UserType;
}

export interface AdminUserFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  pagination: PaginationMeta;
}
