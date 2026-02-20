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
  parent_account_id?: string;
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


/**
 * Account balance types
 */

export interface AccountBalance {
  account_id: string;
  currency: string;
  debit_total: number;
  credit_total: number;
  balance: number;
  base_currency_balance: number;
  as_of_date: string;
  account_type: AccountType;
  account_code: string;
  account_name: string;
  is_consolidated?: boolean;
  child_count?: number;
}

export interface AccountBalanceRequest {
  account_ids: string[];
  as_of_date?: string;
}

export interface AccountBalanceHistoryResponse {
  account_id: string;
  start_date: string;
  end_date: string;
  history: AccountBalance[];
}

/**
 * Audit trail types
 */

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

export interface AuditLogEntry {
  id: string;
  account_id: string;
  action: AuditAction;
  user_id: string;
  timestamp: string;
  changes: Record<string, {
    oldValue?: unknown;
    newValue?: unknown;
  }> | {
    old?: Record<string, unknown>;
    new?: Record<string, unknown>;
  };
  audit_metadata?: Record<string, unknown>;
}

export interface AuditTrailResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface AuditTrailFilters {
  action?: AuditAction;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * Report types
 */

export interface ReportFilters {
  account_type: string;
  status: string;
  as_of_date: string;
}

/**
 * Default account configuration types
 */

export interface DefaultAccountMapping {
  id: string;
  organization_id: string;
  transaction_type: string;
  scenario: string | null;
  account_id: string;
  account_code?: string;
  account_name?: string;
  account_type?: AccountType;
}

export interface DefaultAccountUpdate {
  transaction_type: string;
  scenario?: string | null;
  account_id: string;
}

export interface DefaultAccountUpdateResponse {
  updated: Array<{
    transaction_type: string;
    scenario: string | null;
    account_id: string;
  }>;
  errors: Array<{
    error: string;
    data: unknown;
  }>;
  success_count: number;
  error_count: number;
}

/**
 * System configuration types
 */

export interface AccountCodeFormat {
  format_pattern: string;
  example: string | null;
}
