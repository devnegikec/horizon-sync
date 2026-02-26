/**
 * Integration types for Chart of Accounts components
 * 
 * This file provides TypeScript types and interfaces for integrating
 * Chart of Accounts components with other ERP modules.
 */

import type { AccountType, AccountStatus, Account, AccountListItem } from '../../types/account.types';

/**
 * Re-export core types for convenience
 */
export type { AccountType, AccountStatus, Account, AccountListItem };

/**
 * Account selection result
 */
export interface AccountSelectionResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  currency: string;
}

/**
 * Account validation result
 */
export interface AccountValidationResult {
  isValid: boolean;
  accountExists: boolean;
  isActive: boolean;
  isPostingAccount: boolean;
  error?: string;
}

/**
 * Default account query
 */
export interface DefaultAccountQuery {
  transactionType: string;
  scenario?: string;
}

/**
 * Default account result
 */
export interface DefaultAccountResult {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
}

/**
 * Account posting validation request
 */
export interface AccountPostingValidationRequest {
  accountId: string;
  amount: number;
  currency: string;
  transactionDate: string;
}

/**
 * Integration hooks interface
 * 
 * Modules integrating with Chart of Accounts should implement
 * these hooks to interact with account data.
 */
export interface ChartOfAccountsIntegration {
  /**
   * Validate if an account can receive transaction postings
   */
  validatePostingAccount(accountId: string): Promise<AccountValidationResult>;

  /**
   * Get account details by ID
   */
  getAccount(accountId: string): Promise<Account | null>;

  /**
   * Get account by code
   */
  getAccountByCode(accountCode: string): Promise<Account | null>;

  /**
   * Get default account for a transaction type
   */
  getDefaultAccount(query: DefaultAccountQuery): Promise<DefaultAccountResult | null>;

  /**
   * Search accounts by code or name
   */
  searchAccounts(query: string, filters?: {
    accountType?: AccountType;
    status?: AccountStatus;
  }): Promise<AccountListItem[]>;
}

/**
 * Component integration props
 * 
 * Props that can be passed to Chart of Accounts components
 * when integrating with other modules.
 */
export interface AccountComponentIntegrationProps {
  /**
   * Callback when an account is selected
   */
  onAccountSelected?: (account: AccountSelectionResult) => void;

  /**
   * Callback when account validation changes
   */
  onValidationChange?: (isValid: boolean, error?: string) => void;

  /**
   * Filter accounts by type
   */
  accountTypeFilter?: AccountType;

  /**
   * Filter accounts by status
   */
  statusFilter?: AccountStatus;

  /**
   * Exclude specific account IDs from selection
   */
  excludeAccountIds?: string[];

  /**
   * Show only posting accounts
   */
  postingAccountsOnly?: boolean;
}

/**
 * Transaction posting interface
 * 
 * Interface for posting transactions to accounts from other modules.
 */
export interface TransactionPosting {
  accountId: string;
  amount: number;
  currency: string;
  transactionDate: string;
  description: string;
  referenceType: string;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Batch transaction posting
 */
export interface BatchTransactionPosting {
  postings: TransactionPosting[];
  validateOnly?: boolean;
}

/**
 * Transaction posting result
 */
export interface TransactionPostingResult {
  success: boolean;
  transactionId?: string;
  errors?: Array<{
    accountId: string;
    error: string;
  }>;
}
