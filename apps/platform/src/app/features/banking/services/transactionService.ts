import { BankTransactionListResponse, TransactionFilterParams } from '../types';
import { coreApiClient } from '../../../utility/api-core';

class TransactionService {
    // Get transactions for a bank account
    async getBankTransactions(
        bankAccountId: string,
        page: number = 1,
        pageSize: number = 20,
        filters?: TransactionFilterParams
    ): Promise<BankTransactionListResponse> {
        const params: Record<string, string | number | boolean | undefined> = {
            page,
            page_size: pageSize,
            status: filters?.status,
            transaction_type: filters?.transaction_type,
            date_from: filters?.date_from,
            date_to: filters?.date_to,
            search: filters?.search,
        };

        return coreApiClient.get<BankTransactionListResponse>(
            `/bank-accounts/${bankAccountId}/transactions`,
            params,
        );
    }
}

export const transactionService = new TransactionService();
