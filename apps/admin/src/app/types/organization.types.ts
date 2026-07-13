import type { PaginationMeta } from './common.types';


export type OrgStatus = 'active' | 'inactive' | 'suspended' | 'trial';
export type OrgType = 'enterprise' | 'business' | 'startup' | 'individual';

export interface AdminOrgListItem {
  id: string;
  name: string;
  slug: string;
  display_name: string | null;
  status: OrgStatus;
  organization_type: OrgType;
  is_active: boolean;
  created_at: string;
}

export interface AdminOrgDetailResponse {
  id: string;
  name: string;
  slug: string;
  display_name: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  organization_type: OrgType;
  industry: string | null;
  base_currency: string | null;
  status: OrgStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  user_count: number;
  invoice_count: number;
  payment_total: string; // decimal string
}

export interface AdminOrgCreate {
  name: string;
  slug: string;
  display_name?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  organization_type?: OrgType;
  industry?: string | null;
  base_currency?: string;
  status?: OrgStatus;
  country?: string | null;
}

export interface AdminOrgUpdate {
  name?: string;
  display_name?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  organization_type?: OrgType;
  industry?: string | null;
  base_currency?: string;
  status?: OrgStatus;
  country?: string | null;
}

export interface AdminOrgFilters {
  search?: string;
  status?: OrgStatus;
  page?: number;
  page_size?: number;
}

export interface AdminOrgListResponse {
  organizations: AdminOrgListItem[];
  pagination: PaginationMeta;
}
