import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building, Globe, Users, FileText, ImagePlus, ArrowLeft, MapPin } from 'lucide-react';
import { useForm, UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { getCurrencySymbol } from '../../types/currency.types';

const organizationTypes = [
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'business', label: 'Business' },
  { value: 'startup', label: 'Startup' },
  { value: 'individual', label: 'Individual' },
] as const;

const organizationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.enum(['enterprise', 'business', 'startup', 'individual'], { message: 'Please select an organization type' }),
  industry: z.string().min(1, 'Please select an industry'),
  companySize: z.string().min(1, 'Please select company size'),
  country: z.string().min(1, 'Please select a country'),
  baseCurrency: z.string().optional(),
  organizationDescription: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

const industries = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Manufacturing',
  'Retail & E-commerce',
  'Education',
  'Professional Services',
  'Real Estate',
  'Media & Entertainment',
  'Transportation & Logistics',
  'Energy & Utilities',
  'Government',
  'Non-profit',
  'Other',
];

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1000+ employees' },
];

// Country → default currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'IN': 'INR', 'US': 'USD', 'GB': 'GBP', 'EU': 'EUR', 'DE': 'EUR', 'FR': 'EUR',
  'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'AU': 'AUD', 'CA': 'CAD', 'JP': 'JPY',
  'CN': 'CNY', 'SG': 'SGD', 'AE': 'AED', 'SA': 'SAR', 'CH': 'CHF', 'BR': 'BRL',
  'MX': 'MXN', 'ZA': 'ZAR', 'NG': 'NGN', 'KE': 'KES', 'MY': 'MYR', 'PK': 'PKR',
  'BD': 'BDT', 'NZ': 'NZD', 'HK': 'HKD', 'KR': 'KRW', 'SE': 'SEK', 'NO': 'NOK',
  'DK': 'DKK', 'PL': 'PLN', 'RU': 'RUB', 'TR': 'TRY', 'EG': 'EGP', 'TH': 'THB',
  'ID': 'IDR', 'PH': 'PHP', 'VN': 'VND', 'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP',
};

const SUPPORTED_CURRENCIES_LIST = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
];

const COUNTRIES = [
  { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' }, { code: 'NL', name: 'Netherlands' },
  { code: 'AU', name: 'Australia' }, { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' }, { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'CH', name: 'Switzerland' },
  { code: 'BR', name: 'Brazil' }, { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' }, { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' }, { code: 'MY', name: 'Malaysia' },
  { code: 'PK', name: 'Pakistan' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' }, { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' }, { code: 'DK', name: 'Denmark' },
  { code: 'PL', name: 'Poland' }, { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' }, { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' }, { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' }, { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
];

interface OrganizationFormProps {
  onSubmit: (data: OrganizationFormData & { logoUrl: string }) => Promise<void>;
  onBack?: () => void;
  showBackButton?: boolean;
  submitButtonText?: string;
  defaultValues?: Partial<OrganizationFormData & { logoUrl: string }>;
  className?: string;
}

/**
 * Helper Components
 */

const LogoUpload = ({ logoPreview, onLogoChange }: { logoPreview: string; onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="flex flex-col items-center gap-4 pb-4">
    <label htmlFor="logo-upload"
      className="group relative flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
      {logoPreview ? (
        <img src={logoPreview} alt="Organization logo" className="h-full w-full object-contain rounded-xl p-2" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImagePlus className="h-8 w-8" />
          <span className="text-xs">Upload Logo</span>
        </div>
      )}
      <input id="logo-upload" type="file" accept="image/*" onChange={onLogoChange} className="sr-only" />
    </label>
    <p className="text-sm text-muted-foreground">Add your organization logo</p>
  </div>
);

const OrganizationNameField = ({
  register,
  errors,
}: {
  register: UseFormRegister<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
}) => (
  <div className="space-y-2">
    <Label htmlFor="organizationName">
      Organization Name <span className="text-destructive">*</span>
    </Label>
    <div className="relative">
      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input id="organizationName"
        placeholder="Acme Inc."
        {...register('organizationName')}
        className={`pl-10 ${errors.organizationName ? 'border-destructive' : ''}`}/>
    </div>
    {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName.message}</p>}
  </div>
);

const IndustryAndSizeFields = ({
  setValue,
  errors,
  defaultIndustry,
  defaultCompanySize,
  defaultOrganizationType,
}: {
  setValue: UseFormSetValue<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
  defaultIndustry?: string;
  defaultCompanySize?: string;
  defaultOrganizationType?: string;
}) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="organizationType">
        Organization Type <span className="text-destructive">*</span>
      </Label>
      <Select defaultValue={defaultOrganizationType} onValueChange={(value) => setValue('organizationType', value as OrganizationFormData['organizationType'])}>
        <SelectTrigger className={errors.organizationType ? 'border-destructive' : ''}>
          <Building className="h-4 w-4 text-muted-foreground mr-2" />
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          {organizationTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.organizationType && <p className="text-sm text-destructive">{errors.organizationType.message}</p>}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="industry">
          Industry <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue={defaultIndustry} onValueChange={(value) => setValue('industry', value)}>
          <SelectTrigger className={errors.industry ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.industry && <p className="text-sm text-destructive">{errors.industry.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySize">
          Company Size <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue={defaultCompanySize} onValueChange={(value) => setValue('companySize', value)}>
          <SelectTrigger className={errors.companySize ? 'border-destructive' : ''}>
            <Users className="h-4 w-4 text-muted-foreground mr-2" />
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {companySizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.companySize && <p className="text-sm text-destructive">{errors.companySize.message}</p>}
      </div>
    </div>
  </>
);

const CountryAndCurrencyFields = ({
  setValue,
  watch,
  errors,
  defaultCountry,
  defaultCurrency,
}: {
  setValue: UseFormSetValue<OrganizationFormData>;
  watch: UseFormWatch<OrganizationFormData>;
  errors: FieldErrors<OrganizationFormData>;
  defaultCountry?: string;
  defaultCurrency?: string;
}) => {
  const selectedCountry = watch('country');
  const selectedCurrency = watch('baseCurrency');

  const handleCountryChange = (countryCode: string) => {
    setValue('country', countryCode);
    const suggestedCurrency = COUNTRY_CURRENCY_MAP[countryCode];
    if (suggestedCurrency) {
      setValue('baseCurrency', suggestedCurrency);
    }
  };

  const currencySymbol = getCurrencySymbol(selectedCurrency || 'INR');
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="country">
          <MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
          Country <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue={defaultCountry} value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseCurrency">
          <span className="h-4 w-4 inline-flex items-center justify-center text-sm font-bold mr-2">{currencySymbol}</span>
          Base Currency
        </Label>
        <Select defaultValue={defaultCurrency} value={selectedCurrency} onValueChange={(v) => setValue('baseCurrency', v)}>
          <SelectTrigger className={selectedCountry ? 'bg-muted/50 pointer-events-none' : ''}>
            <SelectValue placeholder="Select a country first" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES_LIST.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="font-mono mr-1">{c.symbol}</span> {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCountry && COUNTRY_CURRENCY_MAP[selectedCountry] && (
          <p className="text-xs text-muted-foreground">
            Auto-selected based on country
          </p>
        )}
      </div>
    </div>
  );
};

const WebsiteField = ({ register, errors }: { register: UseFormRegister<OrganizationFormData>; errors: FieldErrors<OrganizationFormData> }) => (
  <div className="space-y-2">
    <Label htmlFor="websiteUrl">Website URL</Label>
    <div className="relative">
      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input id="websiteUrl"
        type="url"
        placeholder="https://www.example.com"
        {...register('websiteUrl')}
        className={`pl-10 ${errors.websiteUrl ? 'border-destructive' : ''}`}/>
    </div>
    {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
  </div>
);

const DescriptionField = ({ register, charCount }: { register: UseFormRegister<OrganizationFormData>; charCount: number }) => (
  <div className="space-y-2">
    <Label htmlFor="organizationDescription">Organization Description</Label>
    <div className="relative">
      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Textarea id="organizationDescription"
        placeholder="Tell us about your organization..."
        maxLength={1000}
        {...register('organizationDescription')}
        className="pl-10 min-h-[100px] resize-none"/>
    </div>
    <p className={`text-xs text-right ${charCount >= 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>{charCount}/1000 characters</p>
  </div>
);

const FormActions = ({
  showBackButton,
  onBack,
  isSubmitting,
  submitButtonText,
}: {
  showBackButton: boolean;
  onBack?: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
}) => {
  const widthClass = showBackButton ? 'flex-1' : 'w-full';

  return (
    <div className="flex gap-3">
      {showBackButton && onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}
      <Button type="submit"
        className={`${widthClass} bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25`}
        disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : submitButtonText}
      </Button>
    </div>
  );
};

/**
 * Custom hook to encapsulate form state and handlers.
 */
function useOrganizationForm(
  defaultValues: Partial<OrganizationFormData & { logoUrl: string }>,
  onSubmit: (data: OrganizationFormData & { logoUrl: string }) => Promise<void>,
) {
  const [logoPreview, setLogoPreview] = React.useState<string>(defaultValues.logoUrl || '');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: defaultValues.organizationName || '',
      organizationType: defaultValues.organizationType || undefined,
      industry: defaultValues.industry || '',
      companySize: defaultValues.companySize || '',
      country: defaultValues.country || '',
      baseCurrency: defaultValues.baseCurrency || '',
      organizationDescription: defaultValues.organizationDescription || '',
      websiteUrl: defaultValues.websiteUrl || '',
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = form.handleSubmit(async (formData: OrganizationFormData) => {
    await onSubmit({ ...formData, logoUrl: logoPreview });
  });

  const descriptionCharCount = form.watch('organizationDescription')?.length || 0;

  return { ...form, logoPreview, handleLogoChange, handleFormSubmit, descriptionCharCount };
}

/**
 * Main OrganizationForm Component
 */
export function OrganizationForm({
  onSubmit,
  onBack,
  showBackButton = false,
  submitButtonText = 'Create Organization',
  defaultValues = {},
  className = '',
}: OrganizationFormProps) {
  const {
    register,
    setValue,
    watch,
    logoPreview,
    handleLogoChange,
    handleFormSubmit,
    descriptionCharCount,
    formState: { errors, isSubmitting },
  } = useOrganizationForm(defaultValues, onSubmit);

  return (
    <form onSubmit={handleFormSubmit} className={`space-y-6 ${className}`}>
      <LogoUpload logoPreview={logoPreview} onLogoChange={handleLogoChange} />

      <OrganizationNameField register={register} errors={errors} />

      <IndustryAndSizeFields setValue={setValue}
        errors={errors}
        defaultIndustry={defaultValues.industry}
        defaultCompanySize={defaultValues.companySize}
        defaultOrganizationType={defaultValues.organizationType}/>

      <CountryAndCurrencyFields
        setValue={setValue}
        watch={watch}
        errors={errors}
        defaultCountry={defaultValues.country}
        defaultCurrency={defaultValues.baseCurrency}
      />

      <WebsiteField register={register} errors={errors} />

      <DescriptionField register={register} charCount={descriptionCharCount} />

      <FormActions showBackButton={showBackButton} onBack={onBack} isSubmitting={isSubmitting} submitButtonText={submitButtonText} />
    </form>
  );
}