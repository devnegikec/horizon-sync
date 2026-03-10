import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { BankingOverview } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface BankingOverviewStatsProps {
    data: BankingOverview;
}

export function BankingOverviewStats({ data }: BankingOverviewStatsProps) {
    const stats = [
        {
            title: 'Total Balance',
            value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(data.total_balance),
            icon: DollarSign,
            trend: null,
        },
        {
            title: 'Bank Accounts',
            value: data.total_accounts.toString(),
            icon: Activity,
            trend: null,
        },
        {
            title: 'Active Connections',
            value: data.active_connections.toString(),
            icon: TrendingUp,
            trend: null,
        },
        {
            title: 'Pending Transactions',
            value: data.pending_transactions.toString(),
            icon: TrendingDown,
            trend: data.pending_transactions > 0 ? 'warning' : null,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                                <div className={`p-2 rounded-full ${stat.trend === 'warning'
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : 'bg-primary/10 text-primary'
                                    }`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}