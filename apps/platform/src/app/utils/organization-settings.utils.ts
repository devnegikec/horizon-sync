import type {
  OrganizationSettings,
  CurrencyConfig,
  NamingSeriesConfig,
  DocumentType,
  GenerateDocumentNumberParams,
  GenerateDocumentNumberResult,
} from '../types/organization-settings.types';

/**
 * Validates that only one currency has is_base_currency: true
 */
export function validateCurrencies(currencies: CurrencyConfig[]): {
  valid: boolean;
  error?: string;
} {
  const baseCurrencies = currencies.filter((c) => c.is_base_currency);

  if (baseCurrencies.length === 0) {
    return {
      valid: false,
      error: 'At least one currency must be marked as base currency',
    };
  }

  if (baseCurrencies.length > 1) {
    return {
      valid: false,
      error: 'Only one currency can be marked as base currency',
    };
  }

  // Validate ISO 4217 codes (3 uppercase letters)
  const invalidCodes = currencies.filter(
    (c) => !/^[A-Z]{3}$/.test(c.code)
  );
  if (invalidCodes.length > 0) {
    return {
      valid: false,
      error: `Invalid currency codes: ${invalidCodes.map((c) => c.code).join(', ')}`,
    };
  }

  // Validate precision (0-4 decimal places)
  const invalidPrecision = currencies.filter(
    (c) => c.precision < 0 || c.precision > 4
  );
  if (invalidPrecision.length > 0) {
    return {
      valid: false,
      error: 'Currency precision must be between 0 and 4',
    };
  }

  return { valid: true };
}

/**
 * Gets the base currency from settings
 */
export function getBaseCurrency(
  settings: OrganizationSettings
): CurrencyConfig | null {
  return settings.currencies.find((c) => c.is_base_currency) || null;
}

/**
 * Generates the next document number based on naming series configuration
 */
export function generateDocumentNumber(
  params: GenerateDocumentNumberParams
): GenerateDocumentNumberResult {
  const { documentType, settings } = params;
  
  if (!settings || !settings.naming_series) {
    throw new Error('Settings or naming_series is not initialized');
  }
  
  const config = settings.naming_series[documentType];

  if (!config) {
    throw new Error(`No naming series configuration found for ${documentType}`);
  }

  // Increment the current number
  const nextNumber = config.current_number + 1;

  // Pad the number with leading zeros
  const paddedNumber = String(nextNumber).padStart(config.padding, '0');

  // Build the document number
  let documentNumber = config.prefix;

  // Add year if configured
  if (config.include_year) {
    const year = new Date().getFullYear();
    documentNumber += year + (config.separator || '-');
  }

  // Add month if configured
  if (config.include_month) {
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    documentNumber += month + (config.separator || '-');
  }

  // Add the padded number
  documentNumber += paddedNumber;

  // Update settings with new current_number
  const updatedSettings: OrganizationSettings = {
    ...settings,
    naming_series: {
      ...settings.naming_series,
      [documentType]: {
        ...config,
        current_number: nextNumber,
      },
    },
  };

  return {
    documentNumber,
    updatedSettings,
  };
}

/**
 * Validates naming series configuration
 */
export function validateNamingSeries(config: NamingSeriesConfig): {
  valid: boolean;
  error?: string;
} {
  if (!config.prefix || config.prefix.trim() === '') {
    return { valid: false, error: 'Prefix cannot be empty' };
  }

  if (config.current_number < 0) {
    return { valid: false, error: 'Current number cannot be negative' };
  }

  if (config.padding < 1 || config.padding > 10) {
    return { valid: false, error: 'Padding must be between 1 and 10' };
  }

  return { valid: true };
}

/**
 * Validates address configuration
 */
export function validateAddress(address: OrganizationSettings['address']): {
  valid: boolean;
  error?: string;
} {
  const requiredFields = ['street_address', 'city', 'state_province', 'postal_code', 'country'];
  const missingFields = requiredFields.filter((field) => !address[field as keyof typeof address]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  // Validate email format if provided
  if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validates complete organization settings
 */
export function validateOrganizationSettings(
  settings: OrganizationSettings
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate currencies
  const currencyValidation = validateCurrencies(settings.currencies);
  if (!currencyValidation.valid && currencyValidation.error) {
    errors.push(currencyValidation.error);
  }

  // Validate naming series
  Object.entries(settings.naming_series).forEach(([docType, config]) => {
    if (config) {
      const validation = validateNamingSeries(config);
      if (!validation.valid && validation.error) {
        errors.push(`${docType}: ${validation.error}`);
      }
    }
  });

  // Validate address
  const addressValidation = validateAddress(settings.address);
  if (!addressValidation.valid && addressValidation.error) {
    errors.push(addressValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats a currency amount using the currency configuration
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyConfig
): string {
  return `${currency.symbol}${amount.toFixed(currency.precision)}`;
}

/**
 * Preview what the next document number will be (without incrementing)
 */
export function previewDocumentNumber(
  documentType: DocumentType,
  settings: OrganizationSettings
): string {
  if (!settings || !settings.naming_series) {
    return 'N/A';
  }
  
  const config = settings.naming_series[documentType];

  if (!config) {
    return 'N/A';
  }

  const nextNumber = config.current_number + 1;
  const paddedNumber = String(nextNumber).padStart(config.padding, '0');

  let documentNumber = config.prefix;

  if (config.include_year) {
    const year = new Date().getFullYear();
    documentNumber += year + (config.separator || '-');
  }

  if (config.include_month) {
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    documentNumber += month + (config.separator || '-');
  }

  documentNumber += paddedNumber;

  return documentNumber;
}
