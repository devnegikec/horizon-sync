import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { updateBankAccountSchema, UpdateBankAccountFormData, BankAccount } from '../../types';
import { useUpdateBankAccount } from '../../hooks';
import { bankingValidation } from '../../hooks/useBankingValidation';
import { glAccountService, GLAccount } from '../../services/glAccountService';

interface EditBankAccountFormProps {
    account: BankAccount;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Supported countries with their display names
const SUPPORTED_COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany (EU)' },
    { code: 'FR', name: 'France (EU)' },
    { code: 'IT', name: 'Italy (EU)' },
    { code: 'ES', name: 'Spain (EU)' },
    { code: 'IN', name: 'India' },
    { code: 'AU', name: 'Australia' },
];

// EU country codes
const EU_COUNTRIES = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'];

export function EditBankAccountForm({ account, onSuccess, onCancel }: EditBankAccountFormProps) {
    console.log('EditBankAccountForm - Component rendered');
    console.log('EditBankAccountForm - account:', account);
    
    const updateBankAccount = useUpdateBankAccount();
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [glAccount, setGlAccount] = useState<GLAccount | null>(null);
    const [loadingGlAccount, setLoadingGlAccount] = useState(true);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isSubmitting, isValid },
        getValues,
    } = useForm<UpdateBankAccountFormData>({
        resolver: zodResolver(updateBankAccountSchema),
        mode: 'onChange', // Enable validation on change to see errors immediately
    });

    // Watch country code changes
    const countryCode = watch('country_code');

    // Fetch GL Account details
    useEffect(() => {
        const fetchGlAccount = async () => {
            try {
                setLoadingGlAccount(true);
                const glAccountData = await glAccountService.getGLAccount(account.gl_account_id);
                setGlAccount(glAccountData);
            } catch (error) {
                console.error('Failed to fetch GL account:', error);
                setGlAccount(null);
            } finally {
                setLoadingGlAccount(false);
            }
        };

        if (account.gl_account_id) {
            fetchGlAccount();
        }
    }, [account.gl_account_id]);

    // Debug: Log form errors whenever they change
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('=== FORM VALIDATION ERRORS DETECTED ===');
            console.log('Errors:', errors);
            console.log('Current form values:', getValues());
        }
    }, [errors, getValues]);

    useEffect(() => {
        reset({
            bank_name: account.bank_name,
            account_holder_name: account.account_holder_name,
            account_number: account.account_number,
            country_code: account.country_code,
            currency: account.currency,
            iban: account.iban || undefined,
            swift_code: account.swift_code || undefined,
            routing_number: account.routing_number || undefined,
            ifsc_code: account.ifsc_code || undefined,
            sort_code: account.sort_code || undefined,
            bsb_number: account.bsb_number || undefined,
            is_primary: account.is_primary,
        });
    }, [account, reset]);

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
                result = bankingValidation.validateIFSC(value);
                break;
        }

        if (!result.valid && result.error) {
            setValidationErrors(prev => ({ ...prev, [fieldName]: result.error || '' }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const onSubmit = async (data: UpdateBankAccountFormData) => {
        console.log('EditBankAccountForm - onSubmit called with data:', data);
        console.log('EditBankAccountForm - account.id:', account.id);
        try {
            console.log('EditBankAccountForm - calling mutateAsync...');
            const result = await updateBankAccount.mutateAsync({ accountId: account.id, data });
            console.log('EditBankAccountForm - mutateAsync result:', result);
            onSuccess?.();
        } catch (error) {
            console.error('EditBankAccountForm - Error in onSubmit:', error);
            // Error handling is done by the mutation hook
        }
    };

    // Determine which fields to show based on country
    const isUS = countryCode === 'US';
    const isEU = countryCode ? EU_COUNTRIES.includes(countryCode) : false;
    const isIN = countryCode === 'IN';
    const isGB = countryCode === 'GB';
    const isAU = countryCode === 'AU';

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Edit Bank Account</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => {
                    console.log('Form onSubmit event triggered');
                    console.log('Event:', e);
                    handleSubmit(onSubmit)(e);
                }} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* GL Account (Read-only) */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="gl_account_display">Linked GL Account</Label>
                            <Input
                                id="gl_account_display"
                                value={
                                    loadingGlAccount 
                                        ? 'Loading...' 
                                        : glAccount 
                                            ? `${glAccount.account_code} - ${glAccount.account_name} (${glAccount.account_type.toUpperCase()})`
                                            : account.gl_account_id
                                }
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-muted-foreground">
                                This bank account is linked to the GL account above. The GL account cannot be changed after creation.
                            </p>
                        </div>

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
                            <Label htmlFor="country_code">Country</Label>
                            <Controller
                                name="country_code"
                                control={control}
                                defaultValue={account.country_code}
                                render={({ field }) => (
                                    <Select
                                        value={field.value || account.country_code}
                                        onValueChange={field.onChange}
                                        disabled
                                    >
                                        <SelectTrigger className="bg-gray-50">
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
                            <p className="text-xs text-gray-500">Country cannot be changed after creation</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                                id="currency"
                                placeholder="USD"
                                maxLength={3}
                                {...register('currency')}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500">Currency cannot be changed after creation</p>
                        </div>
                    </div>

                    {/* Primary Account Checkbox */}
                    <div className="border-t pt-4">
                        <div className="space-y-2">
                            <div className="flex items-start space-x-3">
                                <Controller
                                    name="is_primary"
                                    control={control}
                                    defaultValue={account.is_primary}
                                    render={({ field }) => (
                                        <input
                                            type="checkbox"
                                            id="is_primary"
                                            checked={field.value || false}
                                            onChange={field.onChange}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    )}
                                />
                                <div className="flex-1">
                                    <Label htmlFor="is_primary" className="text-sm font-medium cursor-pointer">
                                        Set as primary bank account
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Only one bank account can be primary per GL account. Setting this as primary will automatically unset any existing primary account for this GL account.
                                    </p>
                                </div>
                            </div>
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
                                                    if (e.target.value) validateField('routing_number', e.target.value);
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
                                                className={errors.account_number ? 'border-red-500' : ''}
                                            />
                                            {errors.account_number && (
                                                <p className="text-sm text-red-600">{errors.account_number.message}</p>
                                            )}
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
                                                    if (e.target.value) validateField('iban', e.target.value);
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
                                                    if (e.target.value) validateField('swift_code', e.target.value);
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
                                                    if (e.target.value) validateField('ifsc_code', e.target.value);
                                                }}
                                                className={errors.ifsc_code || validationErrors.ifsc_code ? 'border-red-500' : ''}
                                            />
                                            {(errors.ifsc_code || validationErrors.ifsc_code) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.ifsc_code?.message || validationErrors.ifsc_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">11-character IFSC code</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="1234567890"
                                                {...register('account_number')}
                                                className={errors.account_number ? 'border-red-500' : ''}
                                            />
                                            {errors.account_number && (
                                                <p className="text-sm text-red-600">{errors.account_number.message}</p>
                                            )}
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
                                                    if (e.target.value) validateField('sort_code', e.target.value);
                                                }}
                                                className={errors.sort_code || validationErrors.sort_code ? 'border-red-500' : ''}
                                            />
                                            {(errors.sort_code || validationErrors.sort_code) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.sort_code?.message || validationErrors.sort_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">Format: 12-34-56</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="12345678"
                                                {...register('account_number')}
                                                className={errors.account_number ? 'border-red-500' : ''}
                                            />
                                            {errors.account_number && (
                                                <p className="text-sm text-red-600">{errors.account_number.message}</p>
                                            )}
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
                                                    if (e.target.value) validateField('bsb_number', e.target.value);
                                                }}
                                                className={errors.bsb_number || validationErrors.bsb_number ? 'border-red-500' : ''}
                                            />
                                            {(errors.bsb_number || validationErrors.bsb_number) && (
                                                <p className="text-sm text-red-600">
                                                    {errors.bsb_number?.message || validationErrors.bsb_number}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">Format: 123-456</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="account_number">Account Number *</Label>
                                            <Input
                                                id="account_number"
                                                placeholder="123456789"
                                                {...register('account_number')}
                                                className={errors.account_number ? 'border-red-500' : ''}
                                            />
                                            {errors.account_number && (
                                                <p className="text-sm text-red-600">{errors.account_number.message}</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                            onClick={() => {
                                console.log('=== SUBMIT BUTTON CLICKED ===');
                                console.log('isSubmitting:', isSubmitting);
                                console.log('isValid:', isValid);
                                console.log('validationErrors:', validationErrors);
                                console.log('form errors:', errors);
                                console.log('form values:', getValues());
                                console.log('Button disabled?', isSubmitting || Object.keys(validationErrors).length > 0);
                            }}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Account'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}