/**
 * Organization Settings Module - TypeScript Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the organization settings module.
 */

/**
 * Organization entity representing a business or company in the platform
 */
export interface Organization {
  id: string;
  name: string;
  display_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  settings: Record<string, any> | null;
  extra_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for updating organization details
 */
export interface UpdateOrganizationRequest {
  name?: string;
  display_name?: string | null;
  settings?: Record<string, any>;
}

/**
 * API response for organization operations
 */
export interface OrganizationResponse {
  id: string;
  name: string;
  display_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  settings: Record<string, any> | null;
  extra_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Currency settings stored in organization.settings field
 */
export interface CurrencySettings {
  currency: string; // ISO 4217 currency code
}

/**
 * Currency option for dropdown selection
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Supported currencies for the platform
 * Requirements: 4.7
 */
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

/**
 * Default currency when none is configured
 */
export const DEFAULT_CURRENCY = 'USD';
