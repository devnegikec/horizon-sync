import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ArrowRight } from 'lucide-react';
import { useCreateTransfer, useBankAccounts } from '../../hooks';

const transferSchema = z.object({
    from_account_id: z.string().min(1, 'From account is required'),
    to_account_id: z.string().min(1, 'To account is required'),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
    reference_number: z.string().optional()
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function TransferForm({ onSuccess, onCancel }: TransferFormProps) {
    const createTransfer = useCreateTransfer();
    const { data: accounts = [] } = useBankAccounts();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema)
    });

    const watchedValues = watch();
    const fromAccountId = watchedValues.from_account_id;
    const toAccountId = watchedValues.to_account_id;
    const amount = watchedValues.amount || 0;

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    const toAccount = accounts.find(acc => acc.id === toAccountId);

    const onSubmit = async (data: TransferFormData) => {
        try {
            await createTransfer.mutateAsync(data);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create transfer:', error);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Create Transfer</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="from_account">From Account *</Label>
                            <Select 
                                onValueChange={(value) => setValue('from_account_id', value)}
                                value={fromAccountId}
                            >
                                <SelectTrigger className={errors.from_account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select source account" />
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
                            <Label htmlFor="to_account">To Account *</Label>
                            <Select 
                                onValueChange={(value) => setValue('to_account_id', value)}
                                value={toAccountId}
                            >
                                <SelectTrigger className={errors.to_account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.filter(acc => acc.id !== fromAccountId).map((account) => (
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
                    </div>

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
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Purpose of transfer"
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
                            placeholder="Optional reference number"
                            {...register('reference_number')}
                        />
                    </div>

                    {/* Transfer Preview */}
                    {fromAccount && toAccount && amount > 0 && (
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h4 className="font-medium mb-4">Transfer Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="font-medium">{fromAccount.bank_name}</p>
                                        <p className="text-sm text-gray-500">
                                            •••• {fromAccount.account_number.slice(-4)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {fromAccount.account_holder_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ArrowRight className="h-6 w-6 text-blue-600" />
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs text-gray-500">Transfer Amount</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="font-medium">{toAccount.bank_name}</p>
                                        <p className="text-sm text-gray-500">
                                            •••• {toAccount.account_number.slice(-4)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {toAccount.account_holder_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {(fromAccount.requires_dual_approval || toAccount.requires_dual_approval) && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ This transfer requires dual approval and will be pending until approved.
                                    </p>
                                </div>
                            )}

                            {fromAccount.daily_transfer_limit && amount > fromAccount.daily_transfer_limit && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">
                                        ❌ Amount exceeds daily transfer limit of ${fromAccount.daily_transfer_limit.toLocaleString()}.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-4 pt-6">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={Boolean(
                                isSubmitting ||
                                !fromAccount ||
                                !toAccount ||
                                amount <= 0 ||
                                (fromAccount.daily_transfer_limit != null && amount > fromAccount.daily_transfer_limit)
                            )}
                        >
                            {isSubmitting ? 'Processing...' : 'Execute Transfer'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}