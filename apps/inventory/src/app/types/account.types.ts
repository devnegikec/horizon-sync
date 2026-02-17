/**
 * Account types for Chart of Accounts
 */

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Account {
  id: string;
  organization_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id: string | null;
  parent?: {
    id: string;
    account_code: string;
    account_name: string;
  } | null;
  currency: string;
  level: number;
  is_group: boolean;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  tags?: unknown;
  extra_data?: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountListItem {
  id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id: string | null;
  currency: string;
  level: number;
  is_group: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AccountFilters {
  search: string;
  account_type: string;
  status: string;
  currency: string;
}

export interface CreateAccountPayload {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: string | null;
  currency?: string;
  level?: number;
  is_group?: boolean;
  opening_balance?: number;
  current_balance?: number;
  is_active?: boolean;
  tags?: unknown;
  extra_data?: Record<string, unknown>;
}

export interface UpdateAccountPayload {
  account_name?: string;
  account_type?: AccountType;
  parent_account_id?: string | null;
  level?: number;
  is_group?: boolean;
  opening_balance?: number;
  current_balance?: number;
  is_active?: boolean;
  tags?: unknown;
  extra_data?: Record<string, unknown>;
}

export interface AccountPaginationResponse {
  chart_of_accounts: AccountListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}
