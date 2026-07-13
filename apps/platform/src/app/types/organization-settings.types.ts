/**
 * Organization Settings Types
 * These types define the structure of the JSON stored in organizations.settings column
 */

// ============================================
// CURRENCY SETTINGS
// ============================================

export interface CurrencyConfig {
  code: string; // ISO 4217 code (e.g., 'USD', 'EUR', 'INR')
  symbol: string; // Currency symbol (e.g., '$', '€', '₹')
  is_base_currency: boolean; // Only one can be true
  precision: number; // Decimal places (e.g., 2 for $1.00, 3 for BHD)
  name?: string; // Optional: Full name (e.g., 'US Dollar')
}

// ============================================
// NAMING SERIES (AUTO-NUMBERING)
// ============================================

export type DocumentType = 
  | 'quotation'
  | 'sales_order'
  | 'pick_list'
  | 'invoice'
  | 'purchase_order'
  | 'rfq'
  | 'material_request'
  | 'delivery_note'
  | 'purchase_receipt'
  | 'payment'
  | 'item';

export interface NamingSeriesConfig {
  prefix: string; // e.g., 'INV-', 'SO-', 'QT-'
  current_number: number; // Current sequence number
  padding: number; // Number of leading zeros (e.g., 4 for '0001')
  separator?: string; // Optional separator (default: '-')
  include_year?: boolean; // Optional: Include year in format (e.g., 'INV-2024-0001')
  include_month?: boolean; // Optional: Include month (e.g., 'INV-2024-01-0001')
}

export type NamingSeriesSettings = {
  [K in DocumentType]?: NamingSeriesConfig;
};

// ============================================
// ADDRESS SETTINGS
// ============================================

export interface AddressConfig {
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string; // Tax identification number
  registration_number?: string; // Company registration number
}

// ============================================
// COMPLETE ORGANIZATION SETTINGS
// ============================================

export interface OrganizationSettings {
  currencies: CurrencyConfig[];
  naming_series: NamingSeriesSettings;
  address: AddressConfig;
  // Future settings can be added here
  fiscal_year_start?: string; // e.g., '04-01' for April 1st
  timezone?: string; // e.g., 'America/New_York'
  date_format?: string; // e.g., 'MM/DD/YYYY', 'DD-MM-YYYY'
  time_format?: '12h' | '24h';
}

// ============================================
// DEFAULT SETTINGS
// ============================================

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
  currencies: [
    {
      code: 'USD',
      symbol: '$',
      is_base_currency: true,
      precision: 2,
      name: 'US Dollar',
    },
  ],
  naming_series: {
    quotation: {
      prefix: 'QT-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    sales_order: {
      prefix: 'SO-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    pick_list: {
      prefix: 'PL-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    invoice: {
      prefix: 'INV-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    purchase_order: {
      prefix: 'PO-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    rfq: {
      prefix: 'RFQ-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    material_request: {
      prefix: 'MR-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    delivery_note: {
      prefix: 'DN-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    purchase_receipt: {
      prefix: 'PR-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    payment: {
      prefix: 'PAY-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
    item: {
      prefix: 'ITM-',
      current_number: 0,
      padding: 4,
      separator: '-',
    },
  },
  address: {
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
  },
  fiscal_year_start: '01-01',
  timezone: 'UTC',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
};

// ============================================
// HELPER TYPES
// ============================================

export interface GenerateDocumentNumberParams {
  documentType: DocumentType;
  settings: OrganizationSettings;
}

export interface GenerateDocumentNumberResult {
  documentNumber: string;
  updatedSettings: OrganizationSettings;
}
