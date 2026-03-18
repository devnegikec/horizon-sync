import { BankAccount, BankAccountHistory, BankAccountListResponse, CreateBankAccountFormData, UpdateBankAccountFormData } from '../types';
import { getAccessToken } from '../../../utility/api-core';

// API Base URL - should come from environment config
// Banking endpoints are on Core Service (port 8001), not Identity Service (port 8000)
const API_BASE_URL = process.env['NX_CORE_API_BASE_URL'] || process.env['NX_API_CORE_URL'] || 'http://localhost:8001';

class BankAccountService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}/api/v1${endpoint}`;
        console.log('Bank API Request:', url, options); // Debug logging

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                // Add auth token from your auth system
                'Authorization': `Bearer ${getAccessToken()}`,
                ...options?.headers,
            },
            ...options,
        });

        console.log('Bank API Response:', response.status, response.statusText); // Debug logging

        if (!response.ok) {
            const error = await response.text();
            console.error('Bank API Error:', error); // Debug logging
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        console.log('Bank API Data:', data); // Debug logging
        return data;
    }



    // Create bank account linked to GL account
    async createBankAccount(glAccountId: string, data: CreateBankAccountFormData): Promise<BankAccount> {
        // Remove gl_account_id from the request body (it's passed in the URL path)
        const { gl_account_id: _, ...bankAccountData } = data;

        return this.request<BankAccount>(`/chart-of-accounts/${glAccountId}/bank-accounts`, {
            method: 'POST',
            body: JSON.stringify(bankAccountData),
        });
    }

    // Check for duplicate bank account using country-aware banking identifiers
    async checkDuplicateBankAccount(params: {
        account_number?: string;
        iban?: string;
        routing_number?: string;
        sort_code?: string;
        bsb_number?: string;
        ifsc_code?: string;
        country_code?: string;
        organization_id?: string;
    }): Promise<{ isDuplicate: boolean; duplicateField?: string; existingAccount?: any }> {

        // Determine the primary banking identifier based on country or available fields
        let bankIdentifier = '';
        let identifierType = '';

        // Check in order of specificity based on country
        const country = params.country_code?.toUpperCase();

        // EU countries prioritize IBAN
        if (country && ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU'].includes(country) && params.iban) {
            bankIdentifier = params.iban;
            identifierType = 'iban';
        }
        // US uses routing + account number or just account number
        else if (country === 'US' && params.routing_number && params.account_number) {
            bankIdentifier = `${params.routing_number}:${params.account_number}`;
            identifierType = 'routing_account';
        }
        // UK uses sort code + account number
        else if (country === 'GB' && params.sort_code && params.account_number) {
            bankIdentifier = `${params.sort_code.replace('-', '')}:${params.account_number}`;
            identifierType = 'sort_account';
        }
        // Australia uses BSB + account number
        else if (country === 'AU' && params.bsb_number && params.account_number) {
            bankIdentifier = `${params.bsb_number.replace('-', '')}:${params.account_number}`;
            identifierType = 'bsb_account';
        }
        // India uses IFSC + account number
        else if (country === 'IN' && params.ifsc_code && params.account_number) {
            bankIdentifier = `${params.ifsc_code}:${params.account_number}`;
            identifierType = 'ifsc_account';
        }
        // Fallback to available identifiers
        else if (params.iban) {
            bankIdentifier = params.iban;
            identifierType = 'iban';
        }
        else if (params.account_number) {
            bankIdentifier = params.account_number;
            identifierType = 'account_number';
        }
        else if (params.routing_number) {
            bankIdentifier = params.routing_number;
            identifierType = 'routing_number';
        }

        if (!bankIdentifier) {
            return { isDuplicate: false };
        }

        // Use the generic bank_identifier parameter
        const response = await this.request<BankAccountListResponse>(
            `/bank-accounts?bank_identifier=${encodeURIComponent(bankIdentifier)}`
        ).catch(() => ({ items: [] }));

        if (response.items && response.items.length > 0) {
            return {
                isDuplicate: true,
                duplicateField: identifierType === 'iban' ? 'iban' : 'account_number',
                existingAccount: response.items[0]
            };
        }

        return { isDuplicate: false };
    }

    // Helper method to build search parameters
    private buildSearchParams(params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }): URLSearchParams {
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
        return searchParams;
    }

    // Get all bank accounts
    async getAllBankAccounts(params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<BankAccount[]> {
        const searchParams = this.buildSearchParams(params);
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
        // Backend uses include_inactive, so we need to invert the active parameter
        if (params?.active !== undefined) {
            searchParams.set('include_inactive', (!params.active).toString());
        }
        // Note: This endpoint doesn't support pagination (limit/offset)
        // It returns all bank accounts for the GL account

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

        // This endpoint returns BankAccount[] directly, not BankAccountListResponse
        const items = await this.request<BankAccount[]>(`/chart-of-accounts/${glAccountId}/bank-accounts${query}`);

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
        console.log('BankAccountService - updateBankAccount called');
        console.log('BankAccountService - accountId:', accountId);
        console.log('BankAccountService - data:', data);
        console.log('BankAccountService - API URL:', `${API_BASE_URL}/api/v1/bank-accounts/${accountId}`);

        const result = await this.request<BankAccount>(`/bank-accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        console.log('BankAccountService - updateBankAccount result:', result);
        return result;
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