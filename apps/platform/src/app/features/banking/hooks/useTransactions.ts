import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../services';
import { TransactionFilterParams } from '../types';

// Query keys for caching
const TRANSACTION_KEYS = {
    all: ['transactions'] as const,
    byBankAccount: (bankAccountId: string) => ['transactions', 'bankAccount', bankAccountId] as const,
    filtered: (bankAccountId: string, page: number, pageSize: number, filters?: TransactionFilterParams) => 
        ['transactions', 'bankAccount', bankAccountId, page, pageSize, filters] as const,
} as const;

// Hook to get transactions for a bank account
export function useBankTransactions(
    bankAccountId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: TransactionFilterParams
) {
    return useQuery({
        queryKey: TRANSACTION_KEYS.filtered(bankAccountId, page, pageSize, filters),
        queryFn: () => transactionService.getBankTransactions(bankAccountId, page, pageSize, filters),
        enabled: !!bankAccountId,
    });
}
