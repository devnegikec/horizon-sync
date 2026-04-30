import { BankingOverview } from '../types';
import { coreApiClient } from '../../../utility/api-core';

class BankingOverviewService {
    // Get banking overview/dashboard data
    async getBankingOverview(): Promise<BankingOverview> {
        return coreApiClient.get<BankingOverview>('/banking/overview');
    }

    // Get account balances
    async getAccountBalances(accountIds?: string[]): Promise<Array<{
        account_id: string;
        bank_name: string;
        balance: number;
        currency: string;
        last_updated: string;
    }>> {
        return coreApiClient.get('/banking/balances', {
            account_ids: accountIds?.join(','),
        });
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
        return coreApiClient.get('/banking/analytics', {
            start_date: params.start_date,
            end_date: params.end_date,
            account_id: params.account_id,
        });
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
        return coreApiClient.get('/banking/activity', { limit });
    }
}

export const bankingOverviewService = new BankingOverviewService();
