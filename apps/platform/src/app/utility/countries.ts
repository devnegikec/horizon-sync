/**
 * Minimal country list with ISO codes and dial codes.
 * Used by the registration form to populate the contact-number country code
 * automatically when the user selects their country.
 */
export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string; // e.g. "+91"
  /** Allowed length(s) of the local (national) phone number, excluding dial code. */
  phoneLength: number | number[];
}

export const COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'India', dialCode: '+91', phoneLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', phoneLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', phoneLength: 10 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', phoneLength: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', phoneLength: 9 },
  { code: 'AU', name: 'Australia', dialCode: '+61', phoneLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', phoneLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', phoneLength: [10, 11] },
  { code: 'FR', name: 'France', dialCode: '+33', phoneLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', phoneLength: [9, 10] },
  { code: 'ES', name: 'Spain', dialCode: '+34', phoneLength: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', phoneLength: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', phoneLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', phoneLength: [7, 8, 9] },
  { code: 'NO', name: 'Norway', dialCode: '+47', phoneLength: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', phoneLength: 8 },
  { code: 'PL', name: 'Poland', dialCode: '+48', phoneLength: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', phoneLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', phoneLength: [10, 11] },
  { code: 'CN', name: 'China', dialCode: '+86', phoneLength: 11 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', phoneLength: [9, 10] },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', phoneLength: 8 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', phoneLength: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', phoneLength: [9, 10] },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', phoneLength: [9, 10, 11, 12] },
  { code: 'PH', name: 'Philippines', dialCode: '+63', phoneLength: 10 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', phoneLength: 9 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', phoneLength: [9, 10] },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', phoneLength: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', phoneLength: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', phoneLength: [8, 9, 10] },
  { code: 'BR', name: 'Brazil', dialCode: '+55', phoneLength: [10, 11] },
  { code: 'MX', name: 'Mexico', dialCode: '+52', phoneLength: 10 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', phoneLength: 10 },
  { code: 'CL', name: 'Chile', dialCode: '+56', phoneLength: 9 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', phoneLength: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', phoneLength: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', phoneLength: [10, 11] },
  { code: 'KE', name: 'Kenya', dialCode: '+254', phoneLength: [9, 10] },
  { code: 'EG', name: 'Egypt', dialCode: '+20', phoneLength: 10 },
  { code: 'RU', name: 'Russia', dialCode: '+7', phoneLength: 10 },
];

export function getCountry(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getDialCodeByCountry(code: string): string | undefined {
  return getCountry(code)?.dialCode;
}

/** Returns a friendly description of expected length(s), e.g. "10 digits" or "10 or 11 digits". */
export function describeExpectedLength(country: CountryOption): string {
  const lens = Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength];
  if (lens.length === 1) return `${lens[0]} digits`;
  return `${lens.slice(0, -1).join(', ')} or ${lens[lens.length - 1]} digits`;
}

/** True if `digits` matches one of the allowed lengths for `country`. */
export function isValidPhoneLength(country: CountryOption, digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  const lens = Array.isArray(country.phoneLength) ? country.phoneLength : [country.phoneLength];
  return lens.includes(digits.length);
}
