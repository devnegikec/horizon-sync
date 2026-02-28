import { useQuery } from '@tanstack/react-query';
import { bankingOverviewService } from '../services';

// Query keys for caching
const BANKING_OVERVIEW_KEYS = {
    overview: ['bankingOverview'] as const,
    balances: (accountIds?: string[]) => ['bankingOverview', 'balances', accountIds] as const,
    analytics: (params: { start_date: string; end_date: string; account_id?: string }) =>
        ['bankingOverview', 'analytics', params] as const,
    activity: (limit: number) => ['bankingOverview', 'activity', limit] as const,
} as const;

// Hook to get banking overview/dashboard data
export function useBankingOverview() {
    return useQuery({
        queryKey: BANKING_OVERVIEW_KEYS.overview,
        queryFn: bankingOverviewService.getBankingOverview,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
}

// Hook to get account balances
export function useAccountBalances(accountIds?: string[]) {
    return useQuery({
        queryKey: BANKING_OVERVIEW_KEYS.balances(accountIds),
        queryFn: () => bankingOverviewService.getAccountBalances(accountIds),
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    });
}

// Hook to get banking analytics
export function useBankingAnalytics(params: {
    start_date: string;
    end_date: string;
    account_id?: string;
}) {
    return useQuery({
        queryKey: BANKING_OVERVIEW_KEYS.analytics(params),
        queryFn: () => bankingOverviewService.getBankingAnalytics(params),
        enabled: !!params.start_date && !!params.end_date,
        staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't change often
    });
}

// Hook to get recent activity
export function useRecentActivity(limit = 10) {
    return useQuery({
        queryKey: BANKING_OVERVIEW_KEYS.activity(limit),
        queryFn: () => bankingOverviewService.getRecentActivity(limit),
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    });
}