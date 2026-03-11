import {
    UnreconciledTransaction,
    UnreconciledJournalEntry,
    BankAccountBalance,
    ReconciliationFilterParams,
    SuggestedMatch,
    ReconciliationHistory,
    UndoReconciliationRequest,
    AutoReconciliationResult,
    ReconciliationReportData,
    ReconciliationReportFilters,
} from '../types';

// API Base URL - should come from environment config
// Banking endpoints are on Core Service (port 8001), not Identity Service (port 8000)
const API_BASE_URL = process.env['NX_CORE_API_BASE_URL'] || process.env['NX_API_CORE_URL'] || 'http://localhost:8001/api/v1';

class ReconciliationService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    private getAuthToken(): string {
        return localStorage.getItem('auth_token') || '';
    }

    // Get unreconciled transactions
    async getUnreconciledTransactions(
        bankAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<UnreconciledTransaction[]> {
        const searchParams = new URLSearchParams();
        searchParams.append('bank_account_id', bankAccountId);
        searchParams.append('date_from', dateFrom);
        searchParams.append('date_to', dateTo);

        const queryString = searchParams.toString();
        return this.request<UnreconciledTransaction[]>(
            `/reconciliations/unreconciled-transactions?${queryString}`
        );
    }

    // Get unreconciled journal entries
    async getUnreconciledJournalEntries(
        glAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<UnreconciledJournalEntry[]> {
        const searchParams = new URLSearchParams();
        searchParams.append('gl_account_id', glAccountId);
        searchParams.append('date_from', dateFrom);
        searchParams.append('date_to', dateTo);

        const queryString = searchParams.toString();
        return this.request<UnreconciledJournalEntry[]>(
            `/reconciliations/unreconciled-journal-entries?${queryString}`
        );
    }

    // Get bank account balance
    async getBankAccountBalance(bankAccountId: string): Promise<BankAccountBalance> {
        return this.request<BankAccountBalance>(
            `/bank-accounts/${bankAccountId}/balance`
        );
    }

    // Get suggested matches
    async getSuggestedMatches(
        bankAccountId?: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<SuggestedMatch[]> {
        const searchParams = new URLSearchParams();
        if (bankAccountId) searchParams.append('bank_account_id', bankAccountId);
        if (dateFrom) searchParams.append('date_from', dateFrom);
        if (dateTo) searchParams.append('date_to', dateTo);

        const queryString = searchParams.toString();
        const endpoint = queryString 
            ? `/reconciliations/suggested?${queryString}`
            : '/reconciliations/suggested';
        
        return this.request<SuggestedMatch[]>(endpoint);
    }

    // Confirm suggested match
    async confirmSuggestedMatch(reconciliationId: string, notes?: string): Promise<void> {
        return this.request<void>(
            `/reconciliations/${reconciliationId}/confirm`,
            {
                method: 'POST',
                body: JSON.stringify({ notes }),
            }
        );
    }

    // Reject suggested match
    async rejectSuggestedMatch(reconciliationId: string, reason: string): Promise<void> {
        return this.request<void>(
            `/reconciliations/${reconciliationId}/reject`,
            {
                method: 'POST',
                body: JSON.stringify({ reason }),
            }
        );
    }

    // Get reconciliation history
    async getReconciliationHistory(
        bankAccountId?: string,
        dateFrom?: string,
        dateTo?: string,
        includeRejected: boolean = true
    ): Promise<ReconciliationHistory[]> {
        const searchParams = new URLSearchParams();
        if (bankAccountId) searchParams.append('bank_account_id', bankAccountId);
        if (dateFrom) searchParams.append('date_from', dateFrom);
        if (dateTo) searchParams.append('date_to', dateTo);
        if (includeRejected) searchParams.append('include_rejected', 'true');

        const queryString = searchParams.toString();
        const endpoint = queryString 
            ? `/reconciliations/history?${queryString}`
            : '/reconciliations/history';
        
        return this.request<ReconciliationHistory[]>(endpoint);
    }

    // Undo reconciliation
    async undoReconciliation(
        reconciliationId: string,
        request: UndoReconciliationRequest
    ): Promise<void> {
        return this.request<void>(
            `/reconciliations/${reconciliationId}/undo`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
    }

    // Run auto-reconciliation
    async runAutoReconciliation(
        bankAccountId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<AutoReconciliationResult> {
        return this.request<AutoReconciliationResult>(
            '/reconciliations/auto-run',
            {
                method: 'POST',
                body: JSON.stringify({
                    bank_account_id: bankAccountId,
                    date_from: dateFrom,
                    date_to: dateTo,
                }),
            }
        );
    }

    // Get reconciliation report
    async getReconciliationReport(
        filters: ReconciliationReportFilters
    ): Promise<ReconciliationReportData> {
        const searchParams = new URLSearchParams();
        if (filters.bank_account_id) searchParams.append('bank_account_id', filters.bank_account_id);
        if (filters.date_from) searchParams.append('date_from', filters.date_from);
        if (filters.date_to) searchParams.append('date_to', filters.date_to);
        if (filters.status && filters.status !== 'all') searchParams.append('status', filters.status);

        const queryString = searchParams.toString();
        const endpoint = queryString 
            ? `/reconciliations/report?${queryString}`
            : '/reconciliations/report';
        
        return this.request<ReconciliationReportData>(endpoint);
    }

    // Export report to CSV
    async exportReportToCSV(filters: ReconciliationReportFilters): Promise<Blob> {
        const searchParams = new URLSearchParams();
        if (filters.bank_account_id) searchParams.append('bank_account_id', filters.bank_account_id);
        if (filters.date_from) searchParams.append('date_from', filters.date_from);
        if (filters.date_to) searchParams.append('date_to', filters.date_to);
        if (filters.status && filters.status !== 'all') searchParams.append('status', filters.status);

        const queryString = searchParams.toString();
        const endpoint = queryString 
            ? `/reconciliations/report/export/csv?${queryString}`
            : '/reconciliations/report/export/csv';
        
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.blob();
    }

    // Export report to PDF
    async exportReportToPDF(filters: ReconciliationReportFilters): Promise<Blob> {
        const searchParams = new URLSearchParams();
        if (filters.bank_account_id) searchParams.append('bank_account_id', filters.bank_account_id);
        if (filters.date_from) searchParams.append('date_from', filters.date_from);
        if (filters.date_to) searchParams.append('date_to', filters.date_to);
        if (filters.status && filters.status !== 'all') searchParams.append('status', filters.status);

        const queryString = searchParams.toString();
        const endpoint = queryString 
            ? `/reconciliations/report/export/pdf?${queryString}`
            : '/reconciliations/report/export/pdf';
        
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        return response.blob();
    }

    // Create manual reconciliation
    async createManualReconciliation(
        bankTransactionId: string,
        journalEntryIds: string[],
        notes?: string
    ): Promise<void> {
        return this.request<void>(
            '/reconciliations/manual',
            {
                method: 'POST',
                body: JSON.stringify({
                    bank_transaction_id: bankTransactionId,
                    journal_entry_ids: journalEntryIds,
                    notes,
                }),
            }
        );
    }

    // Create many-to-one reconciliation
    async createManyToOneReconciliation(
        bankTransactionId: string,
        journalEntryIds: string[],
        notes?: string
    ): Promise<void> {
        return this.request<void>(
            '/reconciliations/many-to-one',
            {
                method: 'POST',
                body: JSON.stringify({
                    bank_transaction_id: bankTransactionId,
                    journal_entry_ids: journalEntryIds,
                    notes,
                }),
            }
        );
    }
}

export const reconciliationService = new ReconciliationService();
