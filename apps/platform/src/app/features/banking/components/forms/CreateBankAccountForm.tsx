import { useState, useEffect } from 'react';
import { useForm, type Resolver, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { createBankAccountSchema, CreateBankAccountFormData } from '../../types';
import { useCreateBankAccount } from '../../hooks';
import { bankingValidation } from '../../hooks/useBankingValidation';
import { glAccountService, type GLAccount } from '../../services/glAccountService';

interface CreateBankAccountFormProps {
    glAccountId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Supported countries with their display names and currencies
const SUPPORTED_COUNTRIES = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'DE', name: 'Germany (EU)', currency: 'EUR' },
    { code: 'FR', name: 'France (EU)', currency: 'EUR' },
    { code: 'IT', name: 'Italy (EU)', currency: 'EUR' },
    { code: 'ES', name: 'Spain (EU)', currency: 'EUR' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
];

// EU country codes
const EU_COUNTRIES = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];

export function CreateBankAccountForm({ glAccountId, onSuccess, onCancel }: CreateBankAccountFormProps) {
    const createBankAccount = useCreateBankAccount();
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
    const [loadingGlAccounts, setLoadingGlAccounts] = useState(true);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CreateBankAccountFormData>({
        resolver: zodResolver(createBankAccountSchema) as Resolver<CreateBankAccountFormData>,
        defaultValues: {
            gl_account_id: glAccountId,
            bank_name: '',
            account_holder_name: '',
            account_number: '',
            country_code: '',
            currency: 'USD',
            is_primary: false,
            online_banking_enabled: false,
            mobile_banking_enabled: false,
            wire_transfer_enabled: false,
            ach_enabled: false,
            requires_dual_approval: false,
            bank_api_enabled: false,
            sync_frequency: 'manual',
        }
    });

    // Fetch GL Accounts on mount
    useEffect(() => {
        const fetchGlAccounts = async () => {
            try {
                setLoadingGlAccounts(true);
                // Fetch ASSET type accounts (bank accounts are typically assets)
                const response = await glAccountService.getGLAccounts({
                    account_type: 'asset',
                    status: 'active',
                    page_size: 100
                });
                
                setGlAccounts(response.items || []);
                
                // If no glAccountId was provided and we have accounts, use the first one
                if ((!glAccountId || glAccountId === '00000000-0000-0000-0000-000000000000') && response.items && response.items.length > 0) {
                    setValue('gl_account_id', response.items[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch GL accounts:', error);
                // If the endpoint doesn't exist or fails, we'll just show an empty list
                // The user can still manually enter a GL account ID if needed
                setGlAccounts([]);
            } finally {
                setLoadingGlAccounts(false);
            }
        };

        fetchGlAccounts();
    }, [glAccountId, setValue]);

    // Watch country code changes
    const countryCode = watch('country_code');

    // Auto-set currency when country changes
    useEffect(() => {
        if (countryCode) {
            const selectedCountryData = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
            if (selectedCountryData) {
                setValue('currency', selectedCountryData.currency);
            }
        }
    }, [countryCode, setValue]);

    // Clear country-specific fields when country changes
    useEffect(() => {
        if (countryCode && countryCode !== selectedCountry) {
            // Clear all country-specific fields
            setValue('routing_number', undefined);
            setValue('iban', undefined);
            setValue('swift_code', undefined);
            setValue('ifsc_code', undefined);
            setValue('sort_code', undefined);
            setValue('bsb_number', undefined);
            setValue('account_number', '');
            
            setSelectedCountry(countryCode);
            setValidationErrors({});
        }
    }, [countryCode, selectedCountry, setValue]);

    // Real-time validation for country-specific fields
    const validateField = (fieldName: string, value: string) => {
        let result: { valid: boolean; error?: string } = { valid: true };

        switch (fieldName) {
            case 'routing_number':
                result = bankingValidation.validateRoutingNumber(value);
                break;
            case 'iban':
                result = bankingValidation.validateIBAN(value);
                break;
            case 'swift_code':
                result = bankingValidation.validateSWIFT(value);
                break;
            case 'sort_code':
                result = bankingValidation.validateSortCode(value);
                break;
            case 'bsb_number':
                result = bankingValidation.validateBSB(value);
                break;
            case 'ifsc_code':
                if (!value) {
                    // Don't set error for empty field - let form validation handle required fields
                    result = { valid: true };
                } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
                    result = { valid: false, error: 'Invalid IFSC code format (e.g., SBIN0001234)' };
                }
                break;
            case 'account_number':
                if (!value) {
                    result = { valid: true };
                } else if (value.length < 8) {
                    result = { valid: false, error: 'Account number must be at least 8 digits' };
                } else if (value.length > 18) {
                    result = { valid: false, error: 'Account number must not exceed 18 digits' };
                } else if (!/^[0-9]+$/.test(value)) {
                    result = { valid: false, error: 'Account number must contain only digits' };
                }
                break;
        }

        if (!result.valid && result.error) {
            setValidationErrors(prev => ({ ...prev, [fieldName]: result.error! }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const onSubmit = async (data: CreateBankAccountFormData) => {
        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data:', data);
        console.log('Validation errors:', validationErrors);
        console.log('Form errors:', errors);
        console.log('GL Account ID:', glAccountId);
        
        // Check if there are any validation errors
        if (Object.keys(validationErrors).length > 0) {
            console.error('Cannot submit - validation errors present:', validationErrors);
            return;
        }
        
        try {
            console.log('Calling createBankAccount.mutateAsync...');
            const result = await createBankAccount.mutateAsync({ glAccountId, data });
            console.log('Bank account created successfully:', result);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create bank account:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
        }
    };

    // Determine which fields to show based on country
    const isUS = countryCode === 'US';
    const isEU = EU_COUNTRIES.includes(countryCode);
    const isIN = countryCode === 'IN';
    const isGB = countryCode === 'GB';
    const isAU = countryCode === 'AU';

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Add Bank Account</CardTitle>
            </CardHeader>
            <CardContent>
                {errors.gl_account_id && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Invalid GL Account configuration. Please select a valid GL Account.
                        </AlertDescription>
                    </Alert>
                )}
                {loadingGlAccounts && (
                    <Alert className="mb-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                            Loading GL Accounts...
                        </AlertDescription>
                    </Alert>
                )}
                <form onSubmit={(e) => {
                    console.log('Form onSubmit event triggered');
                    console.log('Event:', e);
                    console.log('Form validation errors:', errors);
                    console.log('Custom validation errors:', validationErrors);
                    console.log('Is form valid?', Object.keys(errors).length === 0);
                    handleSubmit(
                        (data) => {
                            console.log('handleSubmit SUCCESS - calling onSubmit with data:', data);
                            onSubmit(data);
                        },
                        (errors) => {
                            console.error('handleSubmit FAILED - validation errors:', errors);
                        }
                    )(e);
                }} className="space-y-6">
                    {/* GL Account Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="gl_account_id">GL Account (Chart of Accounts) *</Label>
                        <Controller
                            name="gl_account_id"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={loadingGlAccounts || glAccounts.length === 0}
                                >
                                    <SelectTrigger className={errors.gl_account_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={
                                            loadingGlAccounts 
                                                ? "Loading accounts..." 
                                                : glAccounts.length === 0 
                                                    ? "No GL accounts available" 
                                                    : "Select GL Account"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {glAccounts.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No GL accounts found. Please create Chart of Accounts first.
                                            </div>
                                        ) : (
                                            glAccounts.map(account => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.account_code} - {account.account_name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.gl_account_id && (
                            <p className="text-sm text-red-600">{errors.gl_account_id.message}</p>
                        )}
                        {glAccounts.length === 0 && !loadingGlAccounts && (
                            <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No GL accounts found. Please create Chart of Accounts entries first, or contact your administrator.
                                </AlertDescription>
                            </Alert>
                        )}
                        <p className="text-xs text-muted-foreground">Select the GL account to link this bank account to</p>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank Name *</Label>
                            <Input
                                id="bank_name"
                                placeholder="Bank of America"
                                {...register('bank_name')}
                                className={errors.bank_name ? 'border-red-500' : ''}
                            />
                            {errors.bank_name && (
                                <p className="text-sm text-red-600">{errors.bank_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_holder_name">Account Holder Name *</Label>
                            <Input
                                id="account_holder_name"
                                placeholder="John Doe"
                                {...register('account_holder_name')}
                                className={errors.account_holder_name ? 'border-red-500' : ''}
                            />
                            {errors.account_holder_name && (
                                <p className="text-sm text-red-600">{errors.account_holder_name.message}</p>
                            )}
                        </div>

                        {/* Country Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="country_code">Country *</Label>
                            <Controller
                                name="country_code"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className={errors.country_code ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_COUNTRIES.map(country => (
                                                <SelectItem key={country.code} value={country.code}>
                                                    {country.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.country_code && (
                                <p className="text-sm text-red-600">{errors.country_code.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency *</Label>
                            <Input
                                id="currency"
                                placeholder="USD"
                                maxLength={3}
                                readOnly
                                {...register('currency')}
                                className={`${errors.currency ? 'border-red-500' : ''} bg-muted cursor-not-allowed`}
                            />
                            {errors.currency && (
                                <p className="text-sm text-red-600">{errors.currency.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">Auto-populated based on country</p>
                        </div>
                    </div>

                    {/* Country-Specific Fields */}
                    {countryCode && (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Banking Details for {SUPPORTED_COUNTRIES.find(c => c.code === countryCode)?.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* US Fields */}
                                {isUS && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="routing_number">Routing Number *</Label>
                                            <Input
                                                id="routing_number"
                                                placeholder="123456789"
                                                maxLength={9}
                                                {...register('routing_number')}
                                                onChange={(e) => {
                                                    register('routing_number').onChange(e);
                                                    validateField('routing_number', e.target.value);
                                                }}
                                                className={errors.routing_number || validationErrors.routing_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.routing_number || validationErrors.routing_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.routing_number?.message || validationErrors.routing_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">9-digit routing number</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="1234567890"
                                                {...register('account_number')}
                                                onChange={(e) => {
                                                    register('account_number').onChange(e);
                                                    validateField('account_number', e.target.value);
                                                }}
                                                className={errors.account_number || validationErrors.account_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.account_number || validationErrors.account_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.account_number?.message || validationErrors.account_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">8-18 digit account number</p>
                                        </div>
                                    </>
                                )}

                                {/* EU Fields */}
                                {isEU && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="iban">IBAN *</Label>
                                            <Input
                                                id="iban"
                                                placeholder="DE89 3704 0044 0532 0130 00"
                                                {...register('iban')}
                                                onChange={(e) => {
                                                    register('iban').onChange(e);
                                                    validateField('iban', e.target.value);
                                                }}
                                                className={errors.iban || validationErrors.iban ? 'border-red-500' : ''}
                                            />
                                            {(errors.iban || validationErrors.iban) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.iban?.message || validationErrors.iban}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">International Bank Account Number</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="swift_code">SWIFT Code *</Label>
                                            <Input
                                                id="swift_code"
                                                placeholder="DEUTDEFF"
                                                maxLength={11}
                                                {...register('swift_code')}
                                                onChange={(e) => {
                                                    register('swift_code').onChange(e);
                                                    validateField('swift_code', e.target.value);
                                                }}
                                                className={errors.swift_code || validationErrors.swift_code ? 'border-red-500' : ''}
                                            />
                                            {(errors.swift_code || validationErrors.swift_code) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.swift_code?.message || validationErrors.swift_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">8 or 11 character SWIFT/BIC code</p>
                                        </div>
                                    </>
                                )}

                                {/* India Fields */}
                                {isIN && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="ifsc_code">IFSC Code *</Label>
                                            <Input
                                                id="ifsc_code"
                                                placeholder="SBIN0001234"
                                                maxLength={11}
                                                {...register('ifsc_code')}
                                                onChange={(e) => {
                                                    register('ifsc_code').onChange(e);
                                                    validateField('ifsc_code', e.target.value);
                                                }}
                                                className={errors.ifsc_code || validationErrors.ifsc_code ? 'border-red-500' : ''}
                                            />
                                            {(errors.ifsc_code || validationErrors.ifsc_code) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.ifsc_code?.message || validationErrors.ifsc_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">11-character IFSC code</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="1234567890"
                                                {...register('account_number')}
                                                onChange={(e) => {
                                                    register('account_number').onChange(e);
                                                    validateField('account_number', e.target.value);
                                                }}
                                                className={errors.account_number || validationErrors.account_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.account_number || validationErrors.account_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.account_number?.message || validationErrors.account_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">8-18 digit account number</p>
                                        </div>
                                    </>
                                )}

                                {/* UK Fields */}
                                {isGB && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="sort_code">Sort Code *</Label>
                                            <Input
                                                id="sort_code"
                                                placeholder="12-34-56"
                                                maxLength={8}
                                                {...register('sort_code')}
                                                onChange={(e) => {
                                                    register('sort_code').onChange(e);
                                                    validateField('sort_code', e.target.value);
                                                }}
                                                className={errors.sort_code || validationErrors.sort_code ? 'border-red-500' : ''}
                                            />
                                            {(errors.sort_code || validationErrors.sort_code) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.sort_code?.message || validationErrors.sort_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">Format: 12-34-56</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="12345678"
                                                {...register('account_number')}
                                                onChange={(e) => {
                                                    register('account_number').onChange(e);
                                                    validateField('account_number', e.target.value);
                                                }}
                                                className={errors.account_number || validationErrors.account_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.account_number || validationErrors.account_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.account_number?.message || validationErrors.account_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">8-18 digit account number</p>
                                        </div>
                                    </>
                                )}

                                {/* Australia Fields */}
                                {isAU && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="bsb_number">BSB Number *</Label>
                                            <Input
                                                id="bsb_number"
                                                placeholder="123-456"
                                                maxLength={7}
                                                {...register('bsb_number')}
                                                onChange={(e) => {
                                                    register('bsb_number').onChange(e);
                                                    validateField('bsb_number', e.target.value);
                                                }}
                                                className={errors.bsb_number || validationErrors.bsb_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.bsb_number || validationErrors.bsb_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.bsb_number?.message || validationErrors.bsb_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">Format: 123-456</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="123456789"
                                                {...register('account_number')}
                                                onChange={(e) => {
                                                    register('account_number').onChange(e);
                                                    validateField('account_number', e.target.value);
                                                }}
                                                className={errors.account_number || validationErrors.account_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.account_number || validationErrors.account_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.account_number?.message || validationErrors.account_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">8-18 digit account number</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}