import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { useBankingOverview, useRecentActivity } from '../hooks';
import { BankingOverviewStats } from './ui/BankingOverviewStats';
import { PaymentTransactionRow } from './ui/PaymentTransactionRow';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Plus, RefreshCw, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BankingDashboard() {
    const { data: overview, isLoading: overviewLoading } = useBankingOverview();
    const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);

    if (overviewLoading) {
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
                        <Link to="/banking/accounts/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            {overview && <BankingOverviewStats data={overview} />}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Account Balances */}
                <Card className="lg:col-span-2">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Account Balances</h3>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/banking/accounts">View All</Link>
                            </Button>
                        </div>

                        {overview?.account_balances && overview.account_balances.length > 0 ? (
                            <div className="space-y-4">
                                {overview.account_balances.map((account) => (
                                    <div key={account.account_id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{account.bank_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Last updated: {new Date(account.last_updated).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold">
                                                {new Intl.NumberFormat('en-US', {
                                                    style: 'currency',
                                                    currency: account.currency,
                                                }).format(account.balance)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{account.currency}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">No bank accounts connected</p>
                                <Button asChild>
                                    <Link to="/banking/accounts/new">Add Your First Account</Link>
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
                                <Link to="/banking/activity">View All</Link>
                            </Button>
                        </div>

                        {recentActivity && recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{activity.description}</p>
                                            <p className="text-muted-foreground">{activity.account_name}</p>
                                        </div>
                                        <div className="text-right">
                                            {activity.amount && (
                                                <p className="font-medium">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                    }).format(activity.amount)}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(activity.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                No recent activity
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/banking/payments/new" className="flex flex-col items-center gap-2">
                        <Plus className="h-6 w-6" />
                        <span>New Payment</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/banking/transfers/new" className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6" />
                        <span>Transfer Funds</span>
                    </Link>
                </Button>
                <Button variant="outline" className="h-20" asChild>
                    <Link to="/banking/api" className="flex flex-col items-center gap-2">
                        <Settings className="h-6 w-6" />
                        <span>API Integration</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}