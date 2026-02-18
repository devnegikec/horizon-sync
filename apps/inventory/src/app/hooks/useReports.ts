import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { apiRequest } from '../utility/api';
import type { ReportFilters } from '../types/account.types';

interface ChartOfAccountsReport {
  report_type: string;
  organization_id: string;
  as_of_date: string;
  filters: {
    account_type: string | null;
    status: string | null;
  };
  total_accounts: number;
  accounts: any[];
}

interface HierarchicalReport {
  report_type: string;
  organization_id: string;
  as_of_date: string;
  filters: {
    account_type: string | null;
    status: string | null;
  };
  total_accounts: number;
  tree: any[];
}

interface TrialBalanceReport {
  report_type: string;
  organization_id: string;
  as_of_date: string;
  filters: {
    account_type: string | null;
  };
  total_accounts: number;
  accounts: any[];
  total_debits: number;
  total_credits: number;
  difference: number;
  is_balanced: boolean;
}

export function useReports(filters: ReportFilters) {
  const { accessToken } = useUserStore();
  const [chartOfAccountsReport, setChartOfAccountsReport] = useState<ChartOfAccountsReport | null>(null);
  const [hierarchicalReport, setHierarchicalReport] = useState<HierarchicalReport | null>(null);
  const [trialBalanceReport, setTrialBalanceReport] = useState<TrialBalanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params: Record<string, string> = {};
      if (filters.account_type && filters.account_type !== 'all') {
        params.account_type = filters.account_type;
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.as_of_date) {
        params.as_of_date = filters.as_of_date;
      }

      // Fetch all three reports in parallel
      const [chartResponse, hierarchicalResponse, trialBalanceResponse] = await Promise.all([
        apiRequest<ChartOfAccountsReport>('/accounts/report/chart', accessToken, { params }),
        apiRequest<HierarchicalReport>('/accounts/report/hierarchical', accessToken, { params }),
        apiRequest<TrialBalanceReport>('/accounts/report/trial-balance', accessToken, { params }),
      ]);

      setChartOfAccountsReport(chartResponse);
      setHierarchicalReport(hierarchicalResponse);
      setTrialBalanceReport(trialBalanceResponse);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [filters, accessToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    chartOfAccountsReport,
    hierarchicalReport,
    trialBalanceReport,
    loading,
    error,
    refetch: fetchReports,
  };
}
