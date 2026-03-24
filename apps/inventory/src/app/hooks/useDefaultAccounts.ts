import { useState, useEffect } from 'react';

import { useUserStore } from '@horizon-sync/store';

import { accountApi } from '../utility/api/accounts';
import type { DefaultAccountMapping } from '../types/account.types';

export function useDefaultAccounts() {
  const { accessToken } = useUserStore();
  const [defaultAccounts, setDefaultAccounts] = useState<DefaultAccountMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDefaultAccounts = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);
      const response = await accountApi.getDefaultAccounts(accessToken);
      setDefaultAccounts(response as DefaultAccountMapping[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load default accounts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaultAccounts();
  }, [accessToken]);

  const isDefaultAccount = (accountId: string): boolean => {
    return defaultAccounts.some(mapping => mapping.account_id === accountId);
  };

  const getDefaultAccountUsage = (accountId: string): DefaultAccountMapping[] => {
    return defaultAccounts.filter(mapping => mapping.account_id === accountId);
  };

  return {
    defaultAccounts,
    loading,
    error,
    isDefaultAccount,
    getDefaultAccountUsage,
    refetch: loadDefaultAccounts,
  };
}