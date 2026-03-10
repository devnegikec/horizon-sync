import { BankAccount, BankAccountHistory, BankAccountListResponse, CreateBankAccountFormData, UpdateBankAccountFormData } from '../types';

// API Base URL - should come from environment config
const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

class BankAccountService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                // Add auth token from your auth system
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
        // Get token from your auth system (localStorage, Zustand store, etc.)
        return localStorage.getItem('auth_token') || '';
    }

    // Create bank account linked to GL account
    async createBankAccount(glAccountId: string, data: CreateBankAccountFormData): Promise<BankAccount> {
        return this.request<BankAccount>(`/chart-of-accounts/${glAccountId}/bank-accounts`, {
            method: 'POST',
            body: JSON.stringify(data),
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
            searchParams.append('active', params.active.toString());
        }
        if (params?.limit) {
            searchParams.append('limit', params.limit.toString());
        }
        if (params?.offset) {
            searchParams.append('offset', params.offset.toString());
        }

        const queryString = searchParams.toString();
        const endpoint = `/bank-accounts${queryString ? `?${queryString}` : ''}`;

        const response = await this.request<BankAccountListResponse>(endpoint);
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
        if (params?.active !== undefined) searchParams.set('active', params.active.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return this.request<BankAccountListResponse>(`/chart-of-accounts/${glAccountId}/bank-accounts${query}`);
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