export interface GLAccount {
    id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    currency: string;
    is_active: boolean;
    is_posting_account?: boolean;
}

export interface GLAccountListResponse {
    chart_of_accounts: GLAccount[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
import { useUserStore } from '@horizon-sync/store';

// API Base URL - should come from environment config
const API_BASE_URL = process.env['NX_API_URL'] || 'http://localhost:8001';

class GLAccountService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const accessToken = this.getAccessToken();
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
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

    // Get GL Accounts (Chart of Accounts)
    async getGLAccounts(params?: {
        account_type?: string;
        status?: string;
        page?: number;
        page_size?: number;
    }): Promise<GLAccountListResponse> {
        const searchParams = new URLSearchParams();
        
        if (params?.account_type) searchParams.append('account_type', params.account_type);
        if (params?.status) searchParams.append('status', params.status);
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

        const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
        return this.request<GLAccountListResponse>(`/api/v1/chart-of-accounts${query}`);
    }

    // Get a specific GL Account by ID
    async getGLAccount(accountId: string): Promise<GLAccount> {
        return this.request<GLAccount>(`/api/v1/chart-of-accounts/${accountId}`);
    }

    private getAccessToken(): string {
        const fromStore = useUserStore.getState().accessToken;
        if (fromStore) return fromStore;
        const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (fromStorage) return fromStorage;
        throw new Error('No access token found');
    }
}

export const glAccountService = new GLAccountService();
