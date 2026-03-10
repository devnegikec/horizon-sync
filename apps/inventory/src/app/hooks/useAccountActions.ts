import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../utility/api/accounts';
import type { CreateAccountPayload, UpdateAccountPayload } from '../types/account.types';

export function useAccountActions(): {
  createAccount: (data: CreateAccountPayload) => Promise<any>;
  updateAccount: (id: string, data: UpdateAccountPayload) => Promise<any>;
  deleteAccount: (id: string, force?: boolean) => Promise<void>;
  toggleAccountStatus: (id: string, isActive: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
} {
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async (data: CreateAccountPayload) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await accountApi.create(accessToken, data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, data: UpdateAccountPayload) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await accountApi.update(accessToken, id, data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string, force = false) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      setLoading(true);
      setError(null);
      await accountApi.delete(accessToken, id, force);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleAccountStatus = async (id: string, isActive: boolean) => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      setLoading(true);
      setError(null);
      if (isActive) {
        await accountApi.deactivate(accessToken, id);
      } else {
        await accountApi.activate(accessToken, id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle account status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    loading,
    error,
  };
}
