import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { updateBankAccountSchema, UpdateBankAccountFormData, BankAccount } from '../../types';
import { useUpdateBankAccount } from '../../hooks';

interface EditBankAccountFormProps {
    account: BankAccount;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function EditBankAccountForm({ account, onSuccess, onCancel }: EditBankAccountFormProps) {
    const updateBankAccount = useUpdateBankAccount();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<UpdateBankAccountFormData>({
        resolver: zodResolver(updateBankAccountSchema)
    });

    useEffect(() => {
        reset({
            bank_name: account.bank_name,
            account_holder_name: account.account_holder_name,
            account_number: account.account_number,
            iban: account.iban,
            swift_code: account.swift_code,
        });
    }, [account, reset]);

    const onSubmit = async (data: UpdateBankAccountFormData) => {
        try {
            await updateBankAccount.mutateAsync({ accountId: account.id, data });
            onSuccess?.();
        } catch (error) {
            console.error('Failed to update bank account:', error);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Edit Bank Account</CardTitle>
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
                            {isSubmitting ? 'Updating...' : 'Update Account'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}