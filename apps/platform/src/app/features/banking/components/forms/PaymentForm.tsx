import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { createPaymentSchema, CreatePaymentFormData } from '../../types';
import { useCreatePayment, useBankAccounts } from '../../hooks';

interface PaymentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
    const createPayment = useCreatePayment();
    const { data: accounts = [] } = useBankAccounts();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<CreatePaymentFormData>({
        resolver: zodResolver(createPaymentSchema),
        defaultValues: {
            transaction_type: 'payment',
            currency: 'USD'
        }
    });

    const watchedValues = watch();

    const onSubmit = async (data: CreatePaymentFormData) => {
        try {
            await createPayment.mutateAsync(data);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create payment:', error);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create Payment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="from_account_id">From Account *</Label>
                        <Select 
                            onValueChange={(value) => setValue('from_account_id', value)}
                            value={watchedValues.from_account_id}
                        >
                            <SelectTrigger className={errors.from_account_id ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select account to pay from" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.bank_name} - •••• {account.account_number.slice(-4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.from_account_id && (
                            <p className="text-sm text-red-600">{errors.from_account_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transaction_type">Transaction Type *</Label>
                        <Select 
                            onValueChange={(value) => setValue('transaction_type', value as any)}
                            value={watchedValues.transaction_type}
                        >
                            <SelectTrigger className={errors.transaction_type ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="wire">Wire Transfer</SelectItem>
                                <SelectItem value="ach">ACH Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.transaction_type && (
                            <p className="text-sm text-red-600">{errors.transaction_type.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                                    {...register('amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-sm text-red-600">{errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select 
                                onValueChange={(value) => setValue('currency', value)}
                                value={watchedValues.currency}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="USD" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="to_account_id">To Account</Label>
                        <Select 
                            onValueChange={(value) => setValue('to_account_id', value)}
                            value={watchedValues.to_account_id}
                        >
                            <SelectTrigger className={errors.to_account_id ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select destination account (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.filter(acc => acc.id !== watchedValues.from_account_id).map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.bank_name} - •••• {account.account_number.slice(-4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.to_account_id && (
                            <p className="text-sm text-red-600">{errors.to_account_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Description of payment"
                            className={errors.description ? 'border-red-500' : ''}
                            {...register('description')}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference_number">Reference Number</Label>
                        <Input
                            id="reference_number"
                            placeholder="Optional reference"
                            {...register('reference_number')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scheduled_date">Scheduled Date</Label>
                        <Input
                            id="scheduled_date"
                            type="date"
                            {...register('scheduled_date')}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Create Payment'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}