import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bankAccountService } from '../services';
import { BankAccount, CreateBankAccountFormData, UpdateBankAccountFormData } from '../types';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Query keys for caching
const BANK_ACCOUNT_KEYS = {
    all: ['bankAccounts'] as const,
    byGLAccount: (glAccountId: string) => ['bankAccounts', 'glAccount', glAccountId] as const,
    byId: (id: string) => ['bankAccounts', id] as const,
    history: (id: string) => ['bankAccounts', id, 'history'] as const,
} as const;

// Hook to get all bank accounts
export function useBankAccounts(params?: {
    active?: boolean;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: [...BANK_ACCOUNT_KEYS.all, params],
        queryFn: () => bankAccountService.getAllBankAccounts(params),
    });
}

// Hook to get bank accounts for a GL account
export function useBankAccountsByGLAccount(
    glAccountId: string,
    params?: {
        active?: boolean;
        limit?: number;
        offset?: number;
    }
) {
    return useQuery({
        queryKey: BANK_ACCOUNT_KEYS.byGLAccount(glAccountId),
        queryFn: () => bankAccountService.getBankAccountsByGLAccount(glAccountId, params),
        enabled: !!glAccountId,
    });
}

// Hook to get a specific bank account
export function useBankAccount(accountId: string) {
    return useQuery({
        queryKey: BANK_ACCOUNT_KEYS.byId(accountId),
        queryFn: () => bankAccountService.getBankAccount(accountId),
        enabled: !!accountId,
    });
}

// Hook to get bank account history
export function useBankAccountHistory(accountId: string) {
    return useQuery({
        queryKey: BANK_ACCOUNT_KEYS.history(accountId),
        queryFn: () => bankAccountService.getBankAccountHistory(accountId),
        enabled: !!accountId,
    });
}

// Hook to create a bank account
export function useCreateBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ glAccountId, data }: { glAccountId: string; data: CreateBankAccountFormData }) =>
            bankAccountService.createBankAccount(glAccountId, data),
        onSuccess: (newAccount, { glAccountId }) => {
            // Invalidate and refetch bank accounts for this GL account
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.byGLAccount(glAccountId) });

            toast({
                title: 'Bank Account Created',
                description: `${newAccount.bank_name} account has been successfully created.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Bank Account',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to update a bank account
export function useUpdateBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ accountId, data }: { accountId: string; data: UpdateBankAccountFormData }) =>
            bankAccountService.updateBankAccount(accountId, data),
        onSuccess: (updatedAccount) => {
            // Update the specific account in cache
            queryClient.setQueryData(
                BANK_ACCOUNT_KEYS.byId(updatedAccount.id),
                updatedAccount
            );

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.byGLAccount(updatedAccount.gl_account_id) });

            toast({
                title: 'Bank Account Updated',
                description: `${updatedAccount.bank_name} account has been successfully updated.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Updating Bank Account',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to delete a bank account
export function useDeleteBankAccount() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankAccountService.deleteBankAccount,
        onSuccess: (_, accountId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: BANK_ACCOUNT_KEYS.byId(accountId) });

            // Invalidate list queries
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.all });

            toast({
                title: 'Bank Account Deleted',
                description: 'The bank account has been successfully deleted.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Deleting Bank Account',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to activate/deactivate bank account
export function useToggleBankAccountStatus() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ accountId, activate }: { accountId: string; activate: boolean }) =>
            activate
                ? bankAccountService.activateBankAccount(accountId)
                : bankAccountService.deactivateBankAccount(accountId),
        onSuccess: (updatedAccount, { activate }) => {
            // Update cache
            queryClient.setQueryData(
                BANK_ACCOUNT_KEYS.byId(updatedAccount.id),
                updatedAccount
            );

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: BANK_ACCOUNT_KEYS.byGLAccount(updatedAccount.gl_account_id) });

            toast({
                title: `Bank Account ${activate ? 'Activated' : 'Deactivated'}`,
                description: `${updatedAccount.bank_name} account has been ${activate ? 'activated' : 'deactivated'}.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Updating Account Status',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}