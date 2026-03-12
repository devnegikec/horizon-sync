import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { useBankAccounts } from '../hooks';
import { BankingOverviewStats } from './ui/BankingOverviewStats';
import { PaymentTransactionRow } from './ui/PaymentTransactionRow';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BankingDashboard() {
    // Use useBankAccounts instead of useBankingOverview since the overview endpoint is not implemented
    const { data: bankAccountsData, isLoading: accountsLoading } = useBankAccounts({
        active: true,
        limit: 50,
    });

    if (accountsLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-8 bg-muted rounded w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse h-32 bg-muted rounded" />
                    ))}
                </div>
                <div className="animate-pulse h-64 bg-muted rounded" />
            </div>
        );
    }

    const bankAccounts = bankAccountsData?.items || [];
    const hasAccounts = bankAccounts.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banking</h1>
                    <p className="text-muted-foreground">
                        Manage your bank accounts, payments, and transfers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync All
                    </Button>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                    <Button asChild>
                        <Link to="/settings/banking/accounts/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            {hasAccounts && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <div className="p-6">
                            <p className="text-sm text-muted-foreground">Total Accounts</p>
                            <p className="text-2xl font-bold text-primary">{bankAccounts.length}</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-6">
                            <p className="text-sm text-muted-foreground">Active Accounts</p>
                            <p className="text-2xl font-bold text-green-600">
                                {bankAccounts.filter(a => a.is_active).length}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-6">
                            <p className="text-sm text-muted-foreground">Primary Accounts</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {bankAccounts.filter(a => a.is_primary).length}
                            </p>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-6">
                            <p className="text-sm text-muted-foreground">API Connected</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {bankAccounts.filter(a => a.bank_api_enabled).length}
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Account Balances */}
                <Card className="lg:col-span-2">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Account Balances</h3>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/settings/banking/accounts">View All</Link>
                            </Button>
                        </div>

                        {hasAccounts ? (
                            <div className="space-y-4">
                                {bankAccounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{account.bank_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {account.account_holder_name} • {account.currency}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {account.is_primary && <span className="text-blue-600 font-medium">Primary • </span>}
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Account: {account.account_number}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Updated: {new Date(account.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">No bank accounts connected</p>
                                <Button asChild>
                                    <Link to="/settings/banking/accounts/new">Add Your First Account</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Recent Activity</h3>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/settings/banking/activity">View All</Link>
                            </Button>
                        </div>

                        <p className="text-center text-muted-foreground py-4">
                            No recent activity
                        </p>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/settings/banking/payments/new" className="flex flex-col items-center gap-2">
                        <Plus className="h-6 w-6" />
                        <span>New Payment</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/settings/banking/transfers/new" className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6" />
                        <span>Transfer Funds</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/settings/banking/api" className="flex flex-col items-center gap-2">
                        <Settings className="h-6 w-6" />
                        <span>API Integration</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}