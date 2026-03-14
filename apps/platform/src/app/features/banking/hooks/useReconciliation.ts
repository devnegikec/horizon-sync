import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reconciliationService } from '../services';
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
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Query keys for caching
const RECONCILIATION_KEYS = {
    all: ['reconciliations'] as const,
    unreconciledTransactions: (bankAccountId: string, dateFrom: string, dateTo: string) =>
        ['reconciliations', 'unreconciled-transactions', bankAccountId, dateFrom, dateTo] as const,
    unreconciledJournalEntries: (glAccountId: string, dateFrom: string, dateTo: string) =>
        ['reconciliations', 'unreconciled-journal-entries', glAccountId, dateFrom, dateTo] as const,
    balance: (bankAccountId: string) => ['reconciliations', 'balance', bankAccountId] as const,
    suggestedMatches: (bankAccountId?: string, dateFrom?: string, dateTo?: string) =>
        ['reconciliations', 'suggested-matches', bankAccountId, dateFrom, dateTo] as const,
    history: (bankAccountId?: string, dateFrom?: string, dateTo?: string) =>
        ['reconciliations', 'history', bankAccountId, dateFrom, dateTo] as const,
    report: (filters: ReconciliationReportFilters) =>
        ['reconciliations', 'report', filters] as const,
} as const;

// Hook to get unreconciled transactions
export function useUnreconciledTransactions(
    bankAccountId: string,
    dateFrom: string,
    dateTo: string,
    enabled: boolean = true
) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.unreconciledTransactions(bankAccountId, dateFrom, dateTo),
        queryFn: () => reconciliationService.getUnreconciledTransactions(bankAccountId, dateFrom, dateTo),
        enabled: enabled && !!bankAccountId && !!dateFrom && !!dateTo,
    });
}

// Hook to get unreconciled journal entries
export function useUnreconciledJournalEntries(
    glAccountId: string,
    dateFrom: string,
    dateTo: string,
    enabled: boolean = true
) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.unreconciledJournalEntries(glAccountId, dateFrom, dateTo),
        queryFn: () => reconciliationService.getUnreconciledJournalEntries(glAccountId, dateFrom, dateTo),
        enabled: enabled && !!glAccountId && !!dateFrom && !!dateTo,
    });
}

// Hook to get bank account balance
export function useBankAccountBalance(bankAccountId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.balance(bankAccountId),
        queryFn: () => reconciliationService.getBankAccountBalance(bankAccountId),
        enabled: enabled && !!bankAccountId,
    });
}

// Hook to get suggested matches
export function useSuggestedMatches(
    bankAccountId?: string,
    dateFrom?: string,
    dateTo?: string
) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.suggestedMatches(bankAccountId, dateFrom, dateTo),
        queryFn: () => reconciliationService.getSuggestedMatches(bankAccountId, dateFrom, dateTo),
    });
}

// Hook to confirm suggested match
export function useConfirmSuggestedMatch() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ reconciliationId, notes }: { reconciliationId: string; notes?: string }) =>
            reconciliationService.confirmSuggestedMatch(reconciliationId, notes),
        onSuccess: () => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Match Confirmed',
                description: 'The reconciliation match has been confirmed successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Confirming Match',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to reject suggested match
export function useRejectSuggestedMatch() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ reconciliationId, reason }: { reconciliationId: string; reason: string }) =>
            reconciliationService.rejectSuggestedMatch(reconciliationId, reason),
        onSuccess: () => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Match Rejected',
                description: 'The reconciliation match has been rejected.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Rejecting Match',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to get reconciliation history
export function useReconciliationHistory(
    bankAccountId?: string,
    dateFrom?: string,
    dateTo?: string,
    includeRejected: boolean = true
) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.history(bankAccountId, dateFrom, dateTo),
        queryFn: () => reconciliationService.getReconciliationHistory(
            bankAccountId,
            dateFrom,
            dateTo,
            includeRejected
        ),
    });
}

// Hook to undo reconciliation
export function useUndoReconciliation() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ reconciliationId, request }: { reconciliationId: string; request: UndoReconciliationRequest }) =>
            reconciliationService.undoReconciliation(reconciliationId, request),
        onSuccess: () => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Reconciliation Undone',
                description: 'The reconciliation has been successfully undone.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Undoing Reconciliation',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to run auto-reconciliation
export function useRunAutoReconciliation() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation<AutoReconciliationResult, Error, { bankAccountId: string; dateFrom: string; dateTo: string }>({
        mutationFn: ({ bankAccountId, dateFrom, dateTo }) =>
            reconciliationService.runAutoReconciliation(bankAccountId, dateFrom, dateTo),
        onSuccess: (result) => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Auto-Reconciliation Complete',
                description: `Reconciled ${result.total_reconciled} of ${result.total_processed} transactions.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Running Auto-Reconciliation',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to get reconciliation report
export function useReconciliationReport(filters: ReconciliationReportFilters) {
    return useQuery({
        queryKey: RECONCILIATION_KEYS.report(filters),
        queryFn: () => reconciliationService.getReconciliationReport(filters),
        enabled: !!filters.bank_account_id || !!filters.date_from || !!filters.date_to,
    });
}

// Hook to export report to CSV
export function useExportReportToCSV() {
    const { toast } = useToast();

    return useMutation<Blob, Error, ReconciliationReportFilters>({
        mutationFn: (filters) =>
            reconciliationService.exportReportToCSV(filters),
        onSuccess: (blob) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Report Exported',
                description: 'The reconciliation report has been exported to CSV.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Exporting Report',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to export report to PDF
export function useExportReportToPDF() {
    const { toast } = useToast();

    return useMutation<Blob, Error, ReconciliationReportFilters>({
        mutationFn: (filters) =>
            reconciliationService.exportReportToPDF(filters),
        onSuccess: (blob) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Report Exported',
                description: 'The reconciliation report has been exported to PDF.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Exporting Report',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to create manual reconciliation
export function useCreateManualReconciliation() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ 
            bankTransactionId, 
            journalEntryIds, 
            notes 
        }: { 
            bankTransactionId: string; 
            journalEntryIds: string[]; 
            notes?: string;
        }) =>
            reconciliationService.createManualReconciliation(bankTransactionId, journalEntryIds, notes),
        onSuccess: () => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Reconciliation Created',
                description: 'The manual reconciliation has been created successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Reconciliation',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Hook to create many-to-one reconciliation
export function useCreateManyToOneReconciliation() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ 
            bankTransactionId, 
            journalEntryIds, 
            notes 
        }: { 
            bankTransactionId: string; 
            journalEntryIds: string[]; 
            notes?: string;
        }) =>
            reconciliationService.createManyToOneReconciliation(bankTransactionId, journalEntryIds, notes),
        onSuccess: () => {
            // Invalidate all reconciliation-related queries
            queryClient.invalidateQueries({ queryKey: RECONCILIATION_KEYS.all });

            toast({
                title: 'Many-to-One Reconciliation Created',
                description: 'The many-to-one reconciliation has been created successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error Creating Reconciliation',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}
