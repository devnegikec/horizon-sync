import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { BankAccount } from '../../types';
import { useToggleBankAccountStatus, useDeleteBankAccount } from '../../hooks';
import { bankingValidation } from '../../hooks/useBankingValidation';
import { MoreHorizontal, Edit, Trash2, Power, Settings, RefreshCw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

interface BankAccountCardProps {
    account: BankAccount;
    onEdit?: (account: BankAccount) => void;
    onSync?: (accountId: string) => void;
}

export function BankAccountCard({ account, onEdit, onSync }: BankAccountCardProps) {
    const toggleStatus = useToggleBankAccountStatus();
    const deleteAccount = useDeleteBankAccount();

    const handleToggleStatus = () => {
        toggleStatus.mutate({
            accountId: account.id,
            activate: !account.is_active,
        });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this bank account?')) {
            deleteAccount.mutate(account.id);
        }
    };

    const maskedAccountNumber = bankingValidation.formatAccountNumber(account.account_number);

    return (
        <Card className={`${!account.is_active ? 'opacity-60' : ''}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{account.bank_name}</h3>
                            {account.is_primary && (
                                <Badge variant="default">Primary</Badge>
                            )}
                            <Badge variant={account.is_active ? 'success' : 'secondary'}>
                                {account.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                            {account.account_holder_name}
                        </p>
                        <p className="text-sm font-mono">
                            •••• •••• •••• {account.account_number.slice(-4)}
                        </p>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(account)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleToggleStatus}>
                                <Power className="h-4 w-4 mr-2" />
                                {account.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            {onSync && account.bank_api_enabled && (
                                <DropdownMenuItem onClick={() => onSync(account.id)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Sync Now
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                    {account.iban && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">IBAN:</span>
                            <span className="font-mono">{bankingValidation.formatIBAN(account.iban)}</span>
                        </div>
                    )}
                    {account.swift_code && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">SWIFT:</span>
                            <span className="font-mono">{account.swift_code}</span>
                        </div>
                    )}
                    {account.routing_number && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Routing:</span>
                            <span className="font-mono">{account.routing_number}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            {account.account_type && (
                                <span className="capitalize text-muted-foreground">
                                    {account.account_type}
                                </span>
                            )}
                            {account.account_purpose && (
                                <span className="capitalize text-muted-foreground">
                                    {account.account_purpose}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {account.online_banking_enabled && (
                                <Badge variant="outline">Online</Badge>
                            )}
                            {account.mobile_banking_enabled && (
                                <Badge variant="outline">Mobile</Badge>
                            )}
                            {account.bank_api_enabled && (
                                <Badge variant="outline">API</Badge>
                            )}
                        </div>
                    </div>
                </div>

                {(account.daily_transfer_limit || account.monthly_transfer_limit) && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Transfer Limits</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {account.daily_transfer_limit && (
                                <div>
                                    <span className="text-muted-foreground">Daily:</span>
                                    <span className="ml-2 font-medium">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(account.daily_transfer_limit)}
                                    </span>
                                </div>
                            )}
                            {account.monthly_transfer_limit && (
                                <div>
                                    <span className="text-muted-foreground">Monthly:</span>
                                    <span className="ml-2 font-medium">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(account.monthly_transfer_limit)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}