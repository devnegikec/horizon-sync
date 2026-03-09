export interface GLAccount {
    id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    currency: string;
    is_active: boolean;
}

export interface GLAccountListResponse {
    items: GLAccount[];
    total: number;
    page: number;
    page_size: number;
}

// API Base URL - should come from environment config
const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

class GLAccountService {
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
        return this.request<GLAccountListResponse>(`/chart-of-accounts${query}`);
    }
}

export const glAccountService = new GLAccountService();
