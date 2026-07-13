import { BankApiConnection } from '../types';
import { coreApiClient } from '../../../utility/api-core';

class BankApiService {
    // Connect bank account to API
    async connectBankApi(accountId: string, data: {
        api_provider: string;
        credentials: Record<string, string>;
        sync_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
        auto_reconciliation: boolean;
    }): Promise<BankApiConnection> {
        return coreApiClient.post<BankApiConnection>(`/bank-accounts/${accountId}/api/connect`, data);
    }

    // Disconnect bank API
    async disconnectBankApi(accountId: string): Promise<void> {
        await coreApiClient.delete(`/bank-accounts/${accountId}/api/disconnect`);
    }

    // Test bank API connection
    async testBankApiConnection(accountId: string): Promise<{
        success: boolean;
        message: string;
        balance?: number;
        last_transaction_date?: string;
    }> {
        return coreApiClient.get(`/bank-accounts/${accountId}/api/test`);
    }

    // Sync bank account data
    async syncBankAccount(accountId: string): Promise<{
        transactions_synced: number;
        balance_updated: boolean;
        last_sync: string;
    }> {
        return coreApiClient.post(`/bank-accounts/${accountId}/sync`);
    }

    // Get sync status
    async getSyncStatus(accountId: string): Promise<{
        status: 'idle' | 'syncing' | 'error';
        last_sync: string;
        next_sync?: string;
        error_message?: string;
    }> {
        return coreApiClient.get(`/bank-accounts/${accountId}/sync/status`);
    }

    // Get available bank API providers
    async getBankApiProviders(): Promise<Array<{
        id: string;
        name: string;
        supported_countries: string[];
        features: string[];
        setup_instructions: string;
    }>> {
        return coreApiClient.get('/bank-api/providers');
    }

    // Bulk sync all connected accounts
    async bulkSyncAllAccounts(): Promise<{
        total_accounts: number;
        synced_successfully: number;
        failed: Array<{
            account_id: string;
            error: string;
        }>;
    }> {
        return coreApiClient.post('/bank-api/bulk-sync');
    }
}

export const bankApiService = new BankApiService();
