/**
 * Central color constants for account type badges
 * Single source of truth for consistent account type colors across all components
 */

import { AccountType } from '../types/account.types';

/**
 * Standard color mappings for account types
 * Includes both light and dark mode variants
 */
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  LIABILITY: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  EQUITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  REVENUE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  EXPENSE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
};

/**
 * Helper function to get account type color classes
 * @param type - The account type
 * @returns Tailwind CSS classes for the account type badge
 */
export function getAccountTypeColor(type: AccountType): string {
  return ACCOUNT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
}
