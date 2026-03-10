import { BankApiConnection } from '../types';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

class BankApiService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    private getAuthToken(): string {
        return localStorage.getItem('auth_token') || '';
    }

    // Connect bank account to API
    async connectBankApi(accountId: string, data: {
        api_provider: string;
        credentials: Record<string, string>;
        sync_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
        auto_reconciliation: boolean;
    }): Promise<BankApiConnection> {
        return this.request<BankApiConnection>(`/bank-accounts/${accountId}/api/connect`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Disconnect bank API
    async disconnectBankApi(accountId: string): Promise<void> {
        await this.request(`/bank-accounts/${accountId}/api/disconnect`, {
            method: 'DELETE',
        });
    }

    // Test bank API connection
    async testBankApiConnection(accountId: string): Promise<{
        success: boolean;
        message: string;
        balance?: number;
        last_transaction_date?: string;
    }> {
        return this.request<{
            success: boolean;
            message: string;
            balance?: number;
            last_transaction_date?: string;
        }>(`/bank-accounts/${accountId}/api/test`);
    }

    // Sync bank account data
    async syncBankAccount(accountId: string): Promise<{
        transactions_synced: number;
        balance_updated: boolean;
        last_sync: string;
    }> {
        return this.request<{
            transactions_synced: number;
            balance_updated: boolean;
            last_sync: string;
        }>(`/bank-accounts/${accountId}/sync`, {
            method: 'POST',
        });
    }

    // Get sync status
    async getSyncStatus(accountId: string): Promise<{
        status: 'idle' | 'syncing' | 'error';
        last_sync: string;
        next_sync?: string;
        error_message?: string;
    }> {
        return this.request<{
            status: 'idle' | 'syncing' | 'error';
            last_sync: string;
            next_sync?: string;
            error_message?: string;
        }>(`/bank-accounts/${accountId}/sync/status`);
    }

    // Get available bank API providers
    async getBankApiProviders(): Promise<Array<{
        id: string;
        name: string;
        supported_countries: string[];
        features: string[];
        setup_instructions: string;
    }>> {
        return this.request<Array<{
            id: string;
            name: string;
            supported_countries: string[];
            features: string[];
            setup_instructions: string;
        }>>('/bank-api/providers');
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
        return this.request<{
            total_accounts: number;
            synced_successfully: number;
            failed: Array<{
                account_id: string;
                error: string;
            }>;
        }>('/bank-api/bulk-sync', {
            method: 'POST',
        });
    }
}

export const bankApiService = new BankApiService();