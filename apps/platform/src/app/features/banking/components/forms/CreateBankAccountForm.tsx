import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
import { createBankAccountSchema, CreateBankAccountFormData } from '../../types';
import { useCreateBankAccount } from '../../hooks';

interface CreateBankAccountFormProps {
    glAccountId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CreateBankAccountForm({ glAccountId, onSuccess, onCancel }: CreateBankAccountFormProps) {
    const createBankAccount = useCreateBankAccount();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreateBankAccountFormData>({
        resolver: zodResolver(createBankAccountSchema) as Resolver<CreateBankAccountFormData>,
        defaultValues: {
            gl_account_id: glAccountId,
            bank_name: '',
            account_holder_name: '',
            account_number: '',
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

    const onSubmit = async (data: CreateBankAccountFormData) => {
        try {
            await createBankAccount.mutateAsync({ glAccountId, data });
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create bank account:', error);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Add Bank Account</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                        <div className="space-y-2">
                            <Label htmlFor="iban">IBAN</Label>
                            <Input
                                id="iban"
                                placeholder="GB82 WEST 1234 5698 7654 32"
                                {...register('iban')}
                            />
                        </div>
                    </div>

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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}