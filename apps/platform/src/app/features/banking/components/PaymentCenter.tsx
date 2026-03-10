import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { usePayments } from '../hooks';
import { PaymentForm } from './forms/PaymentForm';
import { PaymentTransactionRow } from './ui/PaymentTransactionRow';
import { Plus, Filter, Download } from 'lucide-react';

export function PaymentCenter() {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const { data: paymentsData, isLoading } = usePayments({
        limit: 20,
    });

    if (showPaymentForm) {
        return (
            <PaymentForm
                onSuccess={() => setShowPaymentForm(false)}
                onCancel={() => setShowPaymentForm(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Center</h1>
                    <p className="text-muted-foreground">
                        Manage payments and transaction history
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button onClick={() => setShowPaymentForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Payment
                    </Button>
                </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Quick Stats */}
                        <Card>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                                        <p className="text-2xl font-bold">{paymentsData?.total || 0}</p>
                                    </div>
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold">
                                            {paymentsData?.items.filter(p => p.status === 'pending').length || 0}
                                        </p>
                                    </div>
                                    <Badge variant="warning">Pending</Badge>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Processing</p>
                                        <p className="text-2xl font-bold">
                                            {paymentsData?.items.filter(p => p.status === 'processing').length || 0}
                                        </p>
                                    </div>
                                    <Badge variant="warning">Processing</Badge>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                        <p className="text-2xl font-bold">
                                            {paymentsData?.items.filter(p => p.status === 'completed').length || 0}
                                        </p>
                                    </div>
                                    <Badge variant="success">Completed</Badge>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Payments */}
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Recent Payments</h3>
                                <Button variant="ghost" size="sm">
                                    View All
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                                    ))}
                                </div>
                            ) : paymentsData?.items && paymentsData.items.length > 0 ? (
                                <div className="space-y-2">
                                    {paymentsData.items.slice(0, 10).map((payment) => (
                                        <PaymentTransactionRow key={payment.id} payment={payment} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">No payments found</p>
                                    <Button onClick={() => setShowPaymentForm(true)}>
                                        Create Your First Payment
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Pending Payments</h3>
                            {paymentsData?.items.filter(p => p.status === 'pending').map((payment) => (
                                <PaymentTransactionRow
                                    key={payment.id}
                                    payment={payment}
                                    showActions
                                />
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="completed">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Completed Payments</h3>
                            {paymentsData?.items.filter(p => p.status === 'completed').map((payment) => (
                                <PaymentTransactionRow key={payment.id} payment={payment} />
                            ))}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="scheduled">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Scheduled Payments</h3>
                            {paymentsData?.items.filter(p => p.scheduled_date).map((payment) => (
                                <PaymentTransactionRow
                                    key={payment.id}
                                    payment={payment}
                                    showActions
                                />
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}