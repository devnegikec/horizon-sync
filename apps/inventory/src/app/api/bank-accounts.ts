/**
 * Bank Accounts API
 * Provides functionality for managing bank accounts in payment workflows
 */

import { apiRequest, buildPaginationParams } from '../utility/api/core';

export interface BankAccount {
    id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    is_active: boolean;
    is_primary: boolean;
    gl_account_id: string;
    bank_api_enabled?: boolean;
    country_code?: string;
    currency?: string;
    iban?: string;
    swift_code?: string;
}

export interface BankAccountListResponse {
    items: BankAccount[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

export const bankAccountApi = {
    /**
     * List bank accounts with pagination and filtering
     */
    list: async (
        accessToken: string,
        page = 1,
        pageSize = 20,
        params?: {
            is_active?: boolean;
            is_primary?: boolean;
            gl_account_id?: string;
            bank_name?: string;
        }
    ): Promise<BankAccountListResponse> => {
        const paginationParams = buildPaginationParams(page, pageSize);
        const queryParams = { ...paginationParams, ...params };

        console.log('Bank Account API - Fetching with params:', queryParams);

        const result = await apiRequest<BankAccountListResponse>('/bank-accounts', accessToken, {
            params: queryParams
        });

        console.log('Bank Account API - Result:', result);
        return result;
    },

    /**
     * Get active bank accounts for payment selection
     */
    listActive: async (accessToken: string): Promise<BankAccount[]> => {
        console.log('Bank Account API - Fetching active accounts');

        const result = await apiRequest<BankAccountListResponse>('/bank-accounts', accessToken, {
            params: { is_active: true, page_size: 100 }
        });

        console.log('Bank Account API - Active accounts result:', result);
        return result.items || [];
    },

    /**
     * Get specific bank account details
     */
    get: (accessToken: string, id: string): Promise<BankAccount> =>
        apiRequest(`/bank-accounts/${id}`, accessToken),

    /**
     * Create a new bank account
     */
    create: (accessToken: string, data: Omit<BankAccount, 'id'>): Promise<BankAccount> =>
        apiRequest('/chart-of-accounts/00000000-0000-0000-0000-000000000000/bank-accounts', accessToken, {
            method: 'POST',
            body: data
        }),

    /**
     * Update bank account
     */
    update: (accessToken: string, id: string, data: Partial<BankAccount>): Promise<BankAccount> =>
        apiRequest(`/bank-accounts/${id}`, accessToken, {
            method: 'PUT',
            body: data
        }),

    /**
     * Delete bank account
     */
    delete: (accessToken: string, id: string): Promise<void> =>
        apiRequest(`/bank-accounts/${id}`, accessToken, {
            method: 'DELETE'
        }),

    /**
     * Activate bank account
     */
    activate: (accessToken: string, id: string): Promise<BankAccount> =>
        apiRequest(`/bank-accounts/${id}/activate`, accessToken, {
            method: 'PUT'
        }),

    /**
     * Deactivate bank account
     */
    deactivate: (accessToken: string, id: string): Promise<BankAccount> =>
        apiRequest(`/bank-accounts/${id}/deactivate`, accessToken, {
            method: 'PUT'
        }),
};