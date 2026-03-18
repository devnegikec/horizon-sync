/**
 * Bank Accounts React Query Hooks
 * Provides React Query hooks for bank account management in payment workflows
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { bankAccountApi, type BankAccount } from '../api/bank-accounts';
import { getAccessToken } from '../utility/api/core';
import { useUserStore } from '@horizon-sync/store';

// Query keys for caching
const BANK_ACCOUNT_KEYS = {
    all: ['bankAccounts'] as const,
    active: ['bankAccounts', 'active'] as const,
    byId: (id: string) => ['bankAccounts', id] as const,
} as const;

/**
 * Hook to get all active bank accounts for payment workflows
 */
export function useActiveBankAccounts() {
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useQuery({
        queryKey: BANK_ACCOUNT_KEYS.active,
        queryFn: async (): Promise<BankAccount[]> => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            console.log('useBankAccounts: Fetching active bank accounts');
            const result = await bankAccountApi.listActive(accessToken);
            console.log('useBankAccounts: Result:', result);
            return result;
        },
        enabled: !!accessToken,
        staleTime: 30_000, // Consider data fresh for 30 seconds
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook to get all bank accounts with pagination
 */
export function useBankAccounts(params?: {
    page?: number;
    pageSize?: number;
    isActive?: boolean;
    isPrimary?: boolean;
}) {
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useQuery({
        queryKey: [...BANK_ACCOUNT_KEYS.all, params],
        queryFn: async () => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            return await bankAccountApi.list(
                accessToken,
                params?.page || 1,
                params?.pageSize || 20,
                {
                    is_active: params?.isActive,
                    is_primary: params?.isPrimary,
                }
            );
        },
        enabled: !!accessToken,
        staleTime: 60_000,
        retry: 2,
    });
}

/**
 * Hook to get specific bank account details
 */
export function useBankAccount(id: string) {
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useQuery({
        queryKey: BANK_ACCOUNT_KEYS.byId(id),
        queryFn: async () => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            return await bankAccountApi.get(accessToken, id);
        },
        enabled: !!accessToken && !!id,
        staleTime: 60_000,
        retry: 2,
    });
}

/**
 * Hook to create a bank account
 */
export function useCreateBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useMutation({
        mutationFn: async (data: Omit<BankAccount, 'id'>) => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            return await bankAccountApi.create(accessToken, data);
        },
        onSuccess: (newAccount) => {
            // Invalidate and refetch bank accounts
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.active });

            toast({
                title: 'Bank Account Created',
                description: `${newAccount.bank_name} account has been successfully created.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Bank Account',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook to update a bank account
 */
export function useUpdateBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BankAccount> }) => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            return await bankAccountApi.update(accessToken, id, data);
        },
        onSuccess: (updatedAccount) => {
            // Update the specific account in cache
            queryClient.setQueryData(
                BANK_ACCOUNT_KEYS.byId(updatedAccount.id),
                updatedAccount
            );

            // Invalidate list queries
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.active });

            toast({
                title: 'Bank Account Updated',
                description: `${updatedAccount.bank_name} account has been successfully updated.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Updating Bank Account',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook to delete a bank account
 */
export function useDeleteBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const accessTokenFromStore = useUserStore((s) => s.accessToken);
    const accessToken = accessTokenFromStore || (() => {
        try {
            return getAccessToken();
        } catch {
            return null;
        }
    })();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!accessToken) {
                throw new Error('No access token available');
            }
            return await bankAccountApi.delete(accessToken, id);
        },
        onSuccess: (_, id) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: BANK_ACCOUNT_KEYS.byId(id) });

            // Invalidate list queries
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.active });

            toast({
                title: 'Bank Account Deleted',
                description: 'The bank account has been successfully deleted.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Deleting Bank Account',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                variant: 'destructive',
            });
        },
    });
}