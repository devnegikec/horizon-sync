import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { useBankAccountsByGLAccount } from '../hooks';
import { BankAccountCard } from './ui/BankAccountCard';
import { CreateBankAccountForm } from './forms/CreateBankAccountForm';
import { EditBankAccountForm } from './forms/EditBankAccountForm';
import { BankAccount } from '../types';
import { Plus, Search } from 'lucide-react';

interface BankAccountManagerProps {
    glAccountId?: string;
}

export function BankAccountManager({ glAccountId = 'default-gl-account' }: BankAccountManagerProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

    const { data: accountsData, isLoading } = useBankAccountsByGLAccount(glAccountId, {
        active: filterActive,
        limit: 50,
    });

    const filteredAccounts = accountsData?.items.filter(account =>
        account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number.includes(searchTerm)
    ) || [];

    if (showCreateForm) {
        return (
            <CreateBankAccountForm
                glAccountId={glAccountId}
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
            />
        );
    }

    if (editingAccount) {
        return (
            <EditBankAccountForm
                account={editingAccount}
                onSuccess={() => setEditingAccount(null)}
                onCancel={() => setEditingAccount(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage your connected bank accounts
                    </p>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                </Button>
            </div>

            {/* Filters and Search */}
            <Card>
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={filterActive === undefined ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterActive(undefined)}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterActive === true ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterActive(true)}
                            >
                                Active
                            </Button>
                            <Button
                                variant={filterActive === false ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilterActive(false)}
                            >
                                Inactive
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Account Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse h-64 bg-muted rounded-lg" />
                    ))}
                </div>
            ) : filteredAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map((account) => (
                        <BankAccountCard
                            key={account.id}
                            account={account}
                            onEdit={setEditingAccount}
                            onSync={(accountId) => {
                                // Sync functionality would be implemented here
                                console.log('Sync account:', accountId);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            {searchTerm
                                ? `No accounts found matching "${searchTerm}"`
                                : 'No bank accounts found'}
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => setShowCreateForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Bank Account
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Summary Stats */}
            {accountsData && accountsData.items.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{accountsData.total}</p>
                                <p className="text-sm text-muted-foreground">Total Accounts</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {accountsData.items.filter(a => a.is_active).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {accountsData.items.filter(a => a.is_primary).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Primary</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {accountsData.items.filter(a => a.bank_api_enabled).length}
                                </p>
                                <p className="text-sm text-muted-foreground">API Connected</p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}