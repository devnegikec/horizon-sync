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

interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
}

interface AccountSelectFieldProps {
    id: string;
    label: string;
    placeholder: string;
    value?: string;
    accounts: BankAccount[];
    error?: { message?: string };
    onChange: (value: string) => void;
}

function AccountSelectField({
    id,
    label,
    placeholder,
    value,
    accounts,
    error,
    onChange
}: AccountSelectFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                            {account.bank_name} - •••• {account.account_number.slice(-4)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && (
                <p className="text-sm text-red-600">{error.message}</p>
            )}
        </div>
    );
}

interface TransactionTypeFieldProps {
    value?: string;
    error?: { message?: string };
    onChange: (value: 'payment' | 'transfer' | 'wire' | 'ach') => void;
}

function TransactionTypeField({ value, error, onChange }: TransactionTypeFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="transaction_type">Transaction Type *</Label>
            <Select
                onValueChange={(val) => onChange(val as 'payment' | 'transfer' | 'wire' | 'ach')}
                value={value}
            >
                <SelectTrigger className={error ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="ach">ACH Transfer</SelectItem>
                </SelectContent>
            </Select>
            {error && (
                <p className="text-sm text-red-600">{error.message}</p>
            )}
        </div>
    );
}

interface AmountFieldsProps {
    amountValue?: number;
    currencyValue?: string;
    amountError?: { message?: string };
    register: any;
    setValue: any;
}

function AmountFields({ amountValue, currencyValue, amountError, register, setValue }: AmountFieldsProps) {
    return (
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
                        className={`pl-8 ${amountError ? 'border-red-500' : ''}`}
                        {...register('amount', { valueAsNumber: true })}
                    />
                </div>
                {amountError && (
                    <p className="text-sm text-red-600">{amountError.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                    onValueChange={(value) => setValue('currency', value)}
                    value={currencyValue}
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
    );
}

interface PaymentDetailsFieldsProps {
    descriptionError?: { message?: string };
    register: any;
}

function PaymentDetailsFields({ descriptionError, register }: PaymentDetailsFieldsProps) {
    return (
        <>
            <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                    id="description"
                    placeholder="Description of payment"
                    className={descriptionError ? 'border-red-500' : ''}
                    {...register('description')}
                />
                {descriptionError && (
                    <p className="text-sm text-red-600">{descriptionError.message}</p>
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
        </>
    );
}

interface FormActionsProps {
    onCancel?: () => void;
    isSubmitting: boolean;
}

function FormActions({ onCancel, isSubmitting }: FormActionsProps) {
    return (
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
    );
}

interface PaymentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
    const createPayment = useCreatePayment();
    const { data: accountsResponse } = useBankAccounts();
    const accounts = accountsResponse?.items || [];

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
            // Error handling is done by the mutation hook
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create Payment</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <AccountSelectField
                        id="from_account_id"
                        label="From Account *"
                        placeholder="Select account to pay from"
                        value={watchedValues.from_account_id}
                        accounts={accounts}
                        error={errors.from_account_id}
                        onChange={(value) => setValue('from_account_id', value)}
                    />

                    <TransactionTypeField
                        value={watchedValues.transaction_type}
                        error={errors.transaction_type}
                        onChange={(value) => setValue('transaction_type', value as 'payment' | 'transfer' | 'wire' | 'ach')}
                    />

                    <AmountFields
                        amountValue={watchedValues.amount}
                        currencyValue={watchedValues.currency}
                        amountError={errors.amount}
                        register={register}
                        setValue={setValue}
                    />

                    <AccountSelectField
                        id="to_account_id"
                        label="To Account"
                        placeholder="Select destination account (optional)"
                        value={watchedValues.to_account_id}
                        accounts={accounts.filter(acc => acc.id !== watchedValues.from_account_id)}
                        error={errors.to_account_id}
                        onChange={(value) => setValue('to_account_id', value)}
                    />

                    <PaymentDetailsFields
                        descriptionError={errors.description}
                        register={register}
                    />

                    <FormActions
                        onCancel={onCancel}
                        isSubmitting={isSubmitting}
                    />
                </form>
            </CardContent>
        </Card>
    );
}