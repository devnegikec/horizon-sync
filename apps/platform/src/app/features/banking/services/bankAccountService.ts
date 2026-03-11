import { log } from 'console';
import { BankAccount, BankAccountHistory, BankAccountListResponse, CreateBankAccountFormData, UpdateBankAccountFormData } from '../types';
import { useUserStore } from '@horizon-sync/store';

// API Base URL - should come from environment config
// Banking endpoints are on Core Service (port 8001), not Identity Service (port 8000)
const API_BASE_URL = process.env['NX_CORE_API_BASE_URL'] || process.env['NX_API_CORE_URL'] || 'http://localhost:8001/api/v1';

class BankAccountService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                // Add auth token from your auth system
                'Authorization': `Bearer ${this.getAccessToken()}`,
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

    private getAccessToken(): string {
        const fromStore = useUserStore.getState().accessToken;
        if (fromStore) return fromStore;
        const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (fromStorage) return fromStorage;
        throw new Error('No access token found');
    }

    // Create bank account linked to GL account
    async createBankAccount(glAccountId: string, data: CreateBankAccountFormData): Promise<BankAccount> {
        // Remove gl_account_id from the request body (it's passed in the URL path)
        const { gl_account_id, ...bankAccountData } = data;
        
        console.log('🔧 Creating bank account with data:', {
            glAccountId,
            removedFields: { gl_account_id },
            sentData: bankAccountData
        });
        
        return this.request<BankAccount>(`/chart-of-accounts/${glAccountId}/bank-accounts`, {
            method: 'POST',
            body: JSON.stringify(bankAccountData),
        });
    }

    // Get all bank accounts
    async getAllBankAccounts(params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<BankAccount[]> {
        const searchParams = new URLSearchParams();
        if (params?.active !== undefined) {
            searchParams.append('is_active', params.active.toString());
        }
        if (params?.limit) {
            searchParams.append('page_size', params.limit.toString());
        }
        if (params?.offset) {
            const page = Math.floor((params.offset || 0) / (params.limit || 20)) + 1;
            searchParams.append('page', page.toString());
        }

        const queryString = searchParams.toString();
        const endpoint = `/bank-accounts${queryString ? `?${queryString}` : ''}`;

        console.log('🔍 Fetching bank accounts:', { endpoint, params });
        const response = await this.request<BankAccountListResponse>(endpoint);
        console.log('✅ Bank accounts response:', response);
        return response.items || [];
    }

    // Get bank accounts for GL account
    async getBankAccountsByGLAccount(
        glAccountId: string,
        params?: {
            active?: boolean;
            limit?: number;
            offset?: number;
        }
    ): Promise<BankAccountListResponse> {
        const searchParams = new URLSearchParams();
        // Backend uses include_inactive, so we need to invert the active parameter
        if (params?.active !== undefined) {
            searchParams.set('include_inactive', (!params.active).toString());
        }
        // Note: This endpoint doesn't support pagination (limit/offset)
        // It returns all bank accounts for the GL account

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        console.log('🔍 Fetching bank accounts by GL account:', { glAccountId, query, params });
        
        // This endpoint returns BankAccount[] directly, not BankAccountListResponse
        const items = await this.request<BankAccount[]>(`/chart-of-accounts/${glAccountId}/bank-accounts${query}`);
        console.log('✅ Bank accounts by GL response:', items);
        
        // Wrap in BankAccountListResponse format for consistency
        return {
            items,
            total: items.length,
            page: 1,
            page_size: items.length,
            total_pages: 1
        };
    }

    // Get specific bank account
    async getBankAccount(accountId: string): Promise<BankAccount> {
        return this.request<BankAccount>(`/bank-accounts/${accountId}`);
    }

    // Update bank account
    async updateBankAccount(accountId: string, data: UpdateBankAccountFormData): Promise<BankAccount> {
        return this.request<BankAccount>(`/bank-accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Delete bank account
    async deleteBankAccount(accountId: string): Promise<void> {
        await this.request(`/bank-accounts/${accountId}`, {
            method: 'DELETE',
        });
    }

    // Activate bank account
    async activateBankAccount(accountId: string): Promise<BankAccount> {
        return this.request<BankAccount>(`/bank-accounts/${accountId}/activate`, {
            method: 'PUT',
        });
    }

    // Deactivate bank account
    async deactivateBankAccount(accountId: string): Promise<BankAccount> {
        return this.request<BankAccount>(`/bank-accounts/${accountId}/deactivate`, {
            method: 'PUT',
        });
    }

    // Get bank account history
    async getBankAccountHistory(accountId: string): Promise<BankAccountHistory[]> {
        return this.request<BankAccountHistory[]>(`/bank-accounts/${accountId}/history`);
    }

    // Validate banking details
    async validateBankingDetails(data: {
        iban?: string;
        swift_code?: string;
        routing_number?: string;
        sort_code?: string;
        bsb_number?: string;
    }): Promise<{ valid: boolean; errors: string[] }> {
        return this.request<{ valid: boolean; errors: string[] }>('/banking/validate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}

export const bankAccountService = new BankAccountService();