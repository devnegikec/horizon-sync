import { BankingOverview } from '../types';

const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

class BankingOverviewService {
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

    // Get banking overview/dashboard data
    async getBankingOverview(): Promise<BankingOverview> {
        return this.request<BankingOverview>('/banking/overview');
    }

    // Get account balances
    async getAccountBalances(accountIds?: string[]): Promise<Array<{
        account_id: string;
        bank_name: string;
        balance: number;
        currency: string;
        last_updated: string;
    }>> {
        const params = accountIds ? `?account_ids=${accountIds.join(',')}` : '';
        return this.request<Array<{
            account_id: string;
            bank_name: string;
            balance: number;
            currency: string;
            last_updated: string;
        }>>(`/banking/balances${params}`);
    }

    // Get banking analytics
    async getBankingAnalytics(params: {
        start_date: string;
        end_date: string;
        account_id?: string;
    }): Promise<{
        total_inflow: number;
        total_outflow: number;
        net_flow: number;
        transaction_count: number;
        average_transaction_size: number;
        monthly_breakdown: Array<{
            month: string;
            inflow: number;
            outflow: number;
            net: number;
        }>;
    }> {
        const searchParams = new URLSearchParams({
            start_date: params.start_date,
            end_date: params.end_date,
        });
        if (params.account_id) {
            searchParams.set('account_id', params.account_id);
        }

        return this.request<{
            total_inflow: number;
            total_outflow: number;
            net_flow: number;
            transaction_count: number;
            average_transaction_size: number;
            monthly_breakdown: Array<{
                month: string;
                inflow: number;
                outflow: number;
                net: number;
            }>;
        }>(`/banking/analytics?${searchParams.toString()}`);
    }

    // Get recent activity
    async getRecentActivity(limit = 10): Promise<Array<{
        id: string;
        type: 'payment' | 'transfer' | 'sync' | 'connection';
        description: string;
        account_name: string;
        amount?: number;
        timestamp: string;
        status: 'success' | 'pending' | 'failed';
    }>> {
        return this.request<Array<{
            id: string;
            type: 'payment' | 'transfer' | 'sync' | 'connection';
            description: string;
            account_name: string;
            amount?: number;
            timestamp: string;
            status: 'success' | 'pending' | 'failed';
        }>>(`/banking/activity?limit=${limit}`);
    }
}

export const bankingOverviewService = new BankingOverviewService();