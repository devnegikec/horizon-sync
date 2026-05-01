import {
    UnreconciledTransaction,
    UnreconciledJournalEntry,
    BankAccountBalance,
    SuggestedMatch,
    ReconciliationHistory,
    UndoReconciliationRequest,
    AutoReconciliationResult,
    ReconciliationReportData,
    ReconciliationReportFilters,
} from '../types';
import { coreApiClient } from '../../../utility/api-core';

class ReconciliationService {
    // Get unreconciled transactions
    async getUnreconciledTransactions(
        bankAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<UnreconciledTransaction[]> {
        return coreApiClient.get<UnreconciledTransaction[]>(
            '/reconciliations/unreconciled-transactions',
            { bank_account_id: bankAccountId, date_from: dateFrom, date_to: dateTo },
        );
    }

    // Get unreconciled journal entries
    async getUnreconciledJournalEntries(
        glAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<UnreconciledJournalEntry[]> {
        return coreApiClient.get<UnreconciledJournalEntry[]>(
            '/reconciliations/unreconciled-journal-entries',
            { gl_account_id: glAccountId, date_from: dateFrom, date_to: dateTo },
        );
    }

    // Get bank account balance
    async getBankAccountBalance(bankAccountId: string): Promise<BankAccountBalance> {
        return coreApiClient.get<BankAccountBalance>(`/bank-accounts/${bankAccountId}/balance`);
    }

    // Get suggested matches
    async getSuggestedMatches(
        bankAccountId?: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<SuggestedMatch[]> {
        return coreApiClient.get<SuggestedMatch[]>('/reconciliations/suggested', {
            bank_account_id: bankAccountId,
            date_from: dateFrom,
            date_to: dateTo,
        });
    }

    // Confirm suggested match
    async confirmSuggestedMatch(reconciliationId: string, notes?: string): Promise<void> {
        return coreApiClient.post(`/reconciliations/${reconciliationId}/confirm`, { notes });
    }

    // Reject suggested match
    async rejectSuggestedMatch(reconciliationId: string, reason: string): Promise<void> {
        return coreApiClient.post(`/reconciliations/${reconciliationId}/reject`, { reason });
    }

    // Get reconciliation history
    async getReconciliationHistory(
        bankAccountId?: string,
        dateFrom?: string,
        dateTo?: string,
        includeRejected: boolean = true
    ): Promise<ReconciliationHistory[]> {
        return coreApiClient.get<ReconciliationHistory[]>('/reconciliations/history', {
            bank_account_id: bankAccountId,
            date_from: dateFrom,
            date_to: dateTo,
            include_rejected: includeRejected ? 'true' : undefined,
        });
    }

    // Undo reconciliation
    async undoReconciliation(
        reconciliationId: string,
        request: UndoReconciliationRequest
    ): Promise<void> {
        return coreApiClient.post(`/reconciliations/${reconciliationId}/undo`, request);
    }

    // Run auto-reconciliation
    async runAutoReconciliation(
        bankAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<AutoReconciliationResult> {
        return coreApiClient.post<AutoReconciliationResult>('/reconciliations/auto-run', {
            bank_account_id: bankAccountId,
            date_from: dateFrom,
            date_to: dateTo,
        });
    }

    // Get reconciliation report
    async getReconciliationReport(
        filters: ReconciliationReportFilters
    ): Promise<ReconciliationReportData> {
        return coreApiClient.get<ReconciliationReportData>('/reconciliations/report', {
            bank_account_id: filters.bank_account_id,
            date_from: filters.date_from,
            date_to: filters.date_to,
            status: filters.status !== 'all' ? filters.status : undefined,
        });
    }

    // Export report to CSV
    async exportReportToCSV(filters: ReconciliationReportFilters): Promise<Blob> {
        const params: Record<string, string | undefined> = {
            bank_account_id: filters.bank_account_id,
            date_from: filters.date_from,
            date_to: filters.date_to,
            status: filters.status !== 'all' ? filters.status : undefined,
        };

        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value) query.append(key, value);
        }
        const qs = query.toString();
        const endpoint = qs
            ? `/reconciliations/report/export/csv?${qs}`
            : '/reconciliations/report/export/csv';

        const response = await coreApiClient.raw(endpoint);
        return response.blob();
    }

    // Export report to PDF
    async exportReportToPDF(filters: ReconciliationReportFilters): Promise<Blob> {
        const params: Record<string, string | undefined> = {
            bank_account_id: filters.bank_account_id,
            date_from: filters.date_from,
            date_to: filters.date_to,
            status: filters.status !== 'all' ? filters.status : undefined,
        };

        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value) query.append(key, value);
        }
        const qs = query.toString();
        const endpoint = qs
            ? `/reconciliations/report/export/pdf?${qs}`
            : '/reconciliations/report/export/pdf';

        const response = await coreApiClient.raw(endpoint);
        return response.blob();
    }

    // Create manual reconciliation
    async createManualReconciliation(
        bankTransactionId: string,
        journalEntryIds: string[],
        notes?: string
    ): Promise<void> {
        return coreApiClient.post('/reconciliations/manual', {
            bank_transaction_id: bankTransactionId,
            journal_entry_ids: journalEntryIds,
            notes,
        });
    }

    // Create many-to-one reconciliation
    async createManyToOneReconciliation(
        bankTransactionId: string,
        journalEntryIds: string[],
        notes?: string
    ): Promise<void> {
        return coreApiClient.post('/reconciliations/many-to-one', {
            bank_transaction_id: bankTransactionId,
            journal_entry_ids: journalEntryIds,
            notes,
        });
    }
}

export const reconciliationService = new ReconciliationService();
