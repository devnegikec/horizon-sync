import { BankTransaction, BankTransactionListResponse, TransactionFilterParams } from '../types';

// API Base URL - should come from environment config
// Banking endpoints are on Core Service (port 8001), not Identity Service (port 8000)
const API_BASE_URL = process.env['NX_CORE_API_BASE_URL'] || process.env['NX_API_BASE_URL'] || 'http://localhost:8001/api/v1';

class TransactionService {
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

    // Get transactions for a bank account
    async getBankTransactions(
        bankAccountId: string,
        page: number = 1,
        pageSize: number = 20,
        filters?: TransactionFilterParams
    ): Promise<BankTransactionListResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('page', page.toString());
        searchParams.append('page_size', pageSize.toString());

        if (filters?.status) {
            searchParams.append('status', filters.status);
        }
        if (filters?.transaction_type) {
            searchParams.append('transaction_type', filters.transaction_type);
        }
        if (filters?.date_from) {
            searchParams.append('date_from', filters.date_from);
        }
        if (filters?.date_to) {
            searchParams.append('date_to', filters.date_to);
        }
        if (filters?.search) {
            searchParams.append('search', filters.search);
        }

        const queryString = searchParams.toString();
        return this.request<BankTransactionListResponse>(
            `/bank-accounts/${bankAccountId}/transactions?${queryString}`
        );
    }
}

export const transactionService = new TransactionService();
