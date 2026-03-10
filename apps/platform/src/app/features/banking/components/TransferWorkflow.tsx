import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { useCreateTransfer, useBankAccountsByGLAccount } from '../hooks';
import { TransferForm } from './forms/TransferForm';
import { useTransferHistory } from '../hooks';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TransferWorkflowProps {
    glAccountId?: string;
}

export function TransferWorkflow({ glAccountId }: TransferWorkflowProps) {
    const [selectedTab, setSelectedTab] = useState('new-transfer');
    const { data: transferHistory } = useTransferHistory();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
            case 'processing':
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'failed':
            case 'cancelled':
                return 'destructive';
            case 'pending':
            case 'processing':
            default:
                return 'warning';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transfer Center</h1>
                    <p className="text-muted-foreground">
                        Transfer funds between your bank accounts
                    </p>
                </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="new-transfer">New Transfer</TabsTrigger>
                    <TabsTrigger value="transfer-history">Transfer History</TabsTrigger>
                </TabsList>

                <TabsContent value="new-transfer">
                    <TransferForm
                        onSuccess={() => setSelectedTab('transfer-history')}
                    />
                </TabsContent>

                <TabsContent value="transfer-history">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Transfer History</h3>

                            {transferHistory && transferHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {transferHistory.map((transfer) => (
                                        <div key={transfer.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(transfer.status)}
                                                    <Badge variant={getStatusColor(transfer.status) as any}>
                                                        {transfer.status}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <p className="font-medium">{transfer.description}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {transfer.reference_number && `Ref: ${transfer.reference_number} • `}
                                                        {new Date(transfer.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-semibold">
                                                    {new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: transfer.currency,
                                                    }).format(transfer.amount)}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <span>From Account</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                    <span>To Account</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">No transfers found</p>
                                    <Button onClick={() => setSelectedTab('new-transfer')}>
                                        Create Your First Transfer
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}