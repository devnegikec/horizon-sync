import { useState, useEffect } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../utility/api/accounts';
import type { AccountBalance } from '../types/account.types';

interface UseAccountBalancesOptions {
  accountIds: string[];
  asOfDate?: string;
  enabled?: boolean;
}

interface UseAccountBalancesResult {
  balances: Map<string, AccountBalance>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAccountBalances({
  accountIds,
  asOfDate,
  enabled = true,
}: UseAccountBalancesOptions): UseAccountBalancesResult {
  const { accessToken } = useUserStore();
  const [balances, setBalances] = useState<Map<string, AccountBalance>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!enabled || accountIds.length === 0) {
      setBalances(new Map());
      setLoading(false);
      return;
    }

    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching balances for accounts:', accountIds);
      
      const response = await accountApi.getBalances(accessToken, accountIds, asOfDate);
      console.log('Balance API response:', response);

      // Convert array to map for easy lookup
      const balanceMap = new Map<string, AccountBalance>();
      if (Array.isArray(response)) {
        response.forEach((balance: AccountBalance) => {
          balanceMap.set(balance.account_id, balance);
        });
      } else {
        console.warn('Balance response is not an array:', response);
      }

      console.log('Processed balances map:', balanceMap);
      setBalances(balanceMap);
    } catch (err) {
      console.error('Failed to fetch account balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
      setBalances(new Map());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [accountIds.join(','), asOfDate, enabled, accessToken]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances,
  };
}
