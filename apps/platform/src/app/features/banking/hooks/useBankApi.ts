import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bankApiService } from '../services';
import { BankApiConnection } from '../types';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Query keys for caching
const BANK_API_KEYS = {
    providers: ['bankApi', 'providers'] as const,
    syncStatus: (accountId: string) => ['bankApi', 'syncStatus', accountId] as const,
    bulkSync: ['bankApi', 'bulkSync'] as const,
} as const;

// Hook to get available bank API providers
export function useBankApiProviders() {
    return useQuery({
        queryKey: BANK_API_KEYS.providers,
        queryFn: bankApiService.getBankApiProviders,
        staleTime: 30 * 60 * 1000, // 30 minutes - providers don't change often
    });
}

// Hook to get sync status for a bank account
export function useBankSyncStatus(accountId: string) {
    return useQuery({
        queryKey: BANK_API_KEYS.syncStatus(accountId),
        queryFn: () => bankApiService.getSyncStatus(accountId),
        enabled: !!accountId,
        refetchInterval: (query) => {
            // Refetch more frequently if currently syncing
            const data = query.state.data;
            return data && data.status === 'syncing' ? 5000 : 30000;
        },
    });
}

// Hook to connect bank API
export function useConnectBankApi() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ accountId, data }: {
            accountId: string;
            data: {
                api_provider: string;
                credentials: Record<string, string>;
                sync_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
                auto_reconciliation: boolean;
            };
        }) => bankApiService.connectBankApi(accountId, data),
        onSuccess: (connection, { accountId }) => {
            // Invalidate sync status to refresh connection info
            queryClient.invalidateQueries({ queryKey: BANK_API_KEYS.syncStatus(accountId) });

            toast({
                title: 'Bank API Connected',
                description: `Successfully connected to ${connection.api_provider}.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Connecting Bank API',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to disconnect bank API
export function useDisconnectBankApi() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankApiService.disconnectBankApi,
        onSuccess: (_, accountId) => {
            // Invalidate sync status
            queryClient.invalidateQueries({ queryKey: BANK_API_KEYS.syncStatus(accountId) });

            toast({
                title: 'Bank API Disconnected',
                description: 'The bank API connection has been removed.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Disconnecting Bank API',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to test bank API connection
export function useTestBankApiConnection() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankApiService.testBankApiConnection,
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: 'Connection Test Successful',
                    description: result.message,
                });
            } else {
                toast({
                    title: 'Connection Test Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        },
        onError: (error) => {
            toast({
                title: 'Error Testing Connection',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to sync bank account
export function useSyncBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankApiService.syncBankAccount,
        onSuccess: (result, accountId) => {
            // Invalidate sync status and potentially other related queries
            queryClient.invalidateQueries({ queryKey: BANK_API_KEYS.syncStatus(accountId) });

            toast({
                title: 'Sync Completed',
                description: `Synced ${result.transactions_synced} transactions. Balance updated: ${result.balance_updated ? 'Yes' : 'No'}.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Syncing Account',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to bulk sync all accounts
export function useBulkSyncAllAccounts() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankApiService.bulkSyncAllAccounts,
        onSuccess: (result) => {
            // Invalidate all sync-related queries
            queryClient.invalidateQueries({ queryKey: ['bankApi', 'syncStatus'] });

            const successMessage = `Synced ${result.synced_successfully}/${result.total_accounts} accounts successfully.`;
            const failureMessage = result.failed.length > 0
                ? ` ${result.failed.length} accounts failed to sync.`
                : '';

            toast({
                title: 'Bulk Sync Completed',
                description: successMessage + failureMessage,
                variant: result.failed.length > 0 ? 'default' : 'default',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error During Bulk Sync',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}