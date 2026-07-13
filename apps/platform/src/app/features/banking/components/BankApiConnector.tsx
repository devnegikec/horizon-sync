import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import {
    useConnectBankApi,
    useDisconnectBankApi,
    useTestBankApiConnection,
    useBankApiProviders,
    useBankSyncStatus,
    useSyncBankAccount,
    useBulkSyncAllAccounts
} from '../hooks';
import { SyncStatusIndicator } from './ui/SyncStatusIndicator';
import { Settings, RefreshCw, Zap, AlertCircle } from 'lucide-react';

interface BankApiConnectorProps {
    accountId?: string;
}

export function BankApiConnector({ accountId }: BankApiConnectorProps) {
    const [selectedTab, setSelectedTab] = useState('overview');
    const [selectedProvider, setSelectedProvider] = useState<string>('');

    const { data: providers } = useBankApiProviders();
    const { data: syncStatus } = useBankSyncStatus(accountId || '');
    const connectApi = useConnectBankApi();
    const disconnectApi = useDisconnectBankApi();
    const testConnection = useTestBankApiConnection();
    const syncAccount = useSyncBankAccount();
    const bulkSync = useBulkSyncAllAccounts();

    const handleConnect = async (provider: string, credentials: Record<string, string>) => {
        if (!accountId) return;

        try {
            await connectApi.mutateAsync({
                accountId,
                data: {
                    api_provider: provider,
                    credentials,
                    sync_frequency: 'daily',
                    auto_reconciliation: true,
                }
            });
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDisconnect = async () => {
        if (!accountId) return;

        if (window.confirm('Are you sure you want to disconnect the bank API?')) {
            try {
                await disconnectApi.mutateAsync(accountId);
            } catch (error) {
                // Error handled in hook
            }
        }
    };

    const handleTest = async () => {
        if (!accountId) return;

        try {
            await testConnection.mutateAsync(accountId);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleSync = async () => {
        if (!accountId) return;

        try {
            await syncAccount.mutateAsync(accountId);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleBulkSync = async () => {
        try {
            await bulkSync.mutateAsync();
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank API Integration</h1>
                    <p className="text-muted-foreground">
                        Connect your bank accounts for automatic data synchronization
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleBulkSync}
                        disabled={bulkSync.isPending}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${bulkSync.isPending ? 'animate-spin' : ''}`} />
                        Sync All Accounts
                    </Button>
                </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="providers">API Providers</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Connection Status */}
                        <Card className="lg:col-span-2">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Connection Status</h3>
                                    {syncStatus && (
                                        <SyncStatusIndicator status={syncStatus} />
                                    )}
                                </div>

                                {accountId && syncStatus ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">Bank API Connection</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Last sync: {new Date(syncStatus.last_sync).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={syncStatus.status === 'idle' ? 'success' :
                                                        syncStatus.status === 'syncing' ? 'warning' : 'destructive'}
                                                >
                                                    {syncStatus.status}
                                                </Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={handleTest}
                                                    disabled={testConnection.isPending}
                                                >
                                                    Test Connection
                                                </Button>
                                            </div>
                                        </div>

                                        {syncStatus.error_message && (
                                            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                                <div className="text-sm text-red-800">
                                                    <p className="font-medium">Sync Error</p>
                                                    <p>{syncStatus.error_message}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Button onClick={handleSync} disabled={syncAccount.isPending}>
                                                <RefreshCw className={`h-4 w-4 mr-2 ${syncAccount.isPending ? 'animate-spin' : ''}`} />
                                                Sync Now
                                            </Button>
                                            <Button variant="outline" onClick={handleDisconnect}>
                                                Disconnect API
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">
                                            No bank API connected for this account
                                        </p>
                                        <Button onClick={() => setSelectedTab('providers')}>
                                            Connect to Bank API
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Sync Statistics</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Connected Accounts</span>
                                        <span className="font-medium">-</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Last Sync</span>
                                        <span className="font-medium">
                                            {syncStatus ? new Date(syncStatus.last_sync).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Next Sync</span>
                                        <span className="font-medium">
                                            {syncStatus?.next_sync ? new Date(syncStatus.next_sync).toLocaleDateString() : 'Manual'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="providers">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Available API Providers</h3>

                            {providers && providers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {providers.map((provider) => (
                                        <div key={provider.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{provider.name}</h4>
                                                <Badge variant="outline">
                                                    {provider.supported_countries.length} countries
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">
                                                {provider.features.join(', ')}
                                            </p>

                                            <div className="space-y-2">
                                                <p className="text-xs font-medium">Supported Countries:</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {provider.supported_countries.join(', ')}
                                                </p>
                                            </div>

                                            <Button
                                                className="w-full mt-4"
                                                size="sm"
                                                onClick={() => {
                                                    // In a real implementation, this would open a connection flow
                                                    setSelectedProvider(provider.id);
                                                }}
                                            >
                                                <Zap className="h-4 w-4 mr-2" />
                                                Connect
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        Loading available providers...
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">API Settings</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Auto Reconciliation</p>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically match transactions with banking data
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Sync Frequency</p>
                                        <p className="text-sm text-muted-foreground">
                                            How often to sync with bank APIs
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-medium">Security Settings</p>
                                        <p className="text-sm text-muted-foreground">
                                            Manage API credentials and security options
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}