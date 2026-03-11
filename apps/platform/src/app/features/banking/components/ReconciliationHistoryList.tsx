import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@horizon-sync/ui/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Loader2, History, Undo2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService';
import { ReconciliationHistory } from '../types';

interface ReconciliationHistoryListProps {
    bankAccountId?: string;
    dateFrom?: string;
    dateTo?: string;
    onReconciliationUndone?: () => void;
}

/**
 * ReconciliationHistoryList Component
 * 
 * Displays the complete history of bank reconciliations.
 * Shows both active and undone reconciliations with audit trail.
 * Allows users to undo reconciliations with confirmation.
 * 
 * Requirements: 17.1-17.10
 */
export function ReconciliationHistoryList({
    bankAccountId,
    dateFrom,
    dateTo,
    onReconciliationUndone,
}: ReconciliationHistoryListProps) {
    const [history, setHistory] = useState<ReconciliationHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Undo dialog state
    const [undoDialogOpen, setUndoDialogOpen] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationHistory | null>(null);
    const [undoReason, setUndoReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadReconciliationHistory();
    }, [bankAccountId, dateFrom, dateTo]);

    const loadReconciliationHistory = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await reconciliationService.getReconciliationHistory(
                bankAccountId,
                dateFrom,
                dateTo,
                true // Include rejected/undone reconciliations
            );
            setHistory(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load reconciliation history';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndoClick = (reconciliation: ReconciliationHistory) => {
        setSelectedReconciliation(reconciliation);
        setUndoReason('');
        setUndoDialogOpen(true);
    };

    const handleUndoReconciliation = async () => {
        if (!selectedReconciliation || !undoReason.trim()) return;

        setIsProcessing(true);
        try {
            await reconciliationService.undoReconciliation(
                selectedReconciliation.id,
                { reason: undoReason }
            );
            
            // Reload history to show updated status
            await loadReconciliationHistory();
            
            setUndoDialogOpen(false);
            setSelectedReconciliation(null);
            setUndoReason('');
            
            if (onReconciliationUndone) {
                onReconciliationUndone();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to undo reconciliation';
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (reconciliation: ReconciliationHistory) => {
        if (!reconciliation.is_active) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Undone
                </Badge>
            );
        }
        
        if (reconciliation.reconciliation_status === 'confirmed') {
            return (
                <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Confirmed
                </Badge>
            );
        }
        
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Rejected
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeLabels: Record<string, string> = {
            manual: 'Manual',
            auto_exact: 'Auto (Exact)',
            auto_fuzzy: 'Auto (Fuzzy)',
            many_to_one: 'Many-to-One',
        };
        
        return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
    };

    const canUndo = (reconciliation: ReconciliationHistory) => {
        return reconciliation.is_active && reconciliation.reconciliation_status === 'confirmed';
    };

    const isOlderThan90Days = (dateString: string) => {
        const date = new Date(dateString);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return date < ninetyDaysAgo;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <History className="h-5 w-5 mr-2" />
                            Reconciliation History
                        </span>
                        <Badge variant="secondary">{history.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading reconciliation history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p>No reconciliation history found</p>
                            <p className="text-sm mt-2">Reconciliations will appear here once created</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Bank Transaction</TableHead>
                                        <TableHead>Journal Entry</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reconciled By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((reconciliation) => (
                                        <TableRow key={reconciliation.id}>
                                            <TableCell>
                                                <p className="text-sm">
                                                    {formatDate(reconciliation.bank_transaction.statement_date)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="text-sm truncate max-w-[200px]">
                                                        {reconciliation.bank_transaction.transaction_description || 'N/A'}
                                                    </p>
                                                    {reconciliation.bank_transaction.bank_reference && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Ref: {reconciliation.bank_transaction.bank_reference}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {reconciliation.journal_entry.entry_no}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(reconciliation.journal_entry.posting_date)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-semibold">
                                                    {formatCurrency(reconciliation.bank_transaction.transaction_amount)}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {getTypeBadge(reconciliation.reconciliation_type)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(reconciliation)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {reconciliation.is_active ? (
                                                        <>
                                                            {reconciliation.reconciled_by && (
                                                                <p className="text-sm">{reconciliation.reconciled_by}</p>
                                                            )}
                                                            {reconciliation.reconciled_at && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDateTime(reconciliation.reconciled_at)}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {reconciliation.undone_by && (
                                                                <p className="text-sm text-destructive">
                                                                    Undone by: {reconciliation.undone_by}
                                                                </p>
                                                            )}
                                                            {reconciliation.undone_at && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDateTime(reconciliation.undone_at)}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {canUndo(reconciliation) && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUndoClick(reconciliation)}
                                                    >
                                                        <Undo2 className="h-4 w-4 mr-1" />
                                                        Undo
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Undo Confirmation Dialog */}
            <Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Undo Reconciliation</DialogTitle>
                        <DialogDescription>
                            This will revert the reconciliation and mark the transaction as cleared.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedReconciliation && (
                        <div className="space-y-4">
                            {/* Transaction Details */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Bank Transaction</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(selectedReconciliation.bank_transaction.statement_date)}
                                    </p>
                                    <p className="text-sm">
                                        {selectedReconciliation.bank_transaction.transaction_description || 'N/A'}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedReconciliation.bank_transaction.transaction_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Journal Entry</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedReconciliation.journal_entry.entry_no}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(selectedReconciliation.journal_entry.posting_date)}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedReconciliation.journal_entry.amount)}
                                    </p>
                                </div>
                            </div>

                            {/* Reconciliation Metadata */}
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Type:</span>
                                    {getTypeBadge(selectedReconciliation.reconciliation_type)}
                                </div>
                                {selectedReconciliation.reconciled_by && (
                                    <p className="text-sm">
                                        <span className="font-medium">Reconciled by:</span> {selectedReconciliation.reconciled_by}
                                    </p>
                                )}
                                {selectedReconciliation.reconciled_at && (
                                    <p className="text-sm">
                                        <span className="font-medium">Reconciled at:</span>{' '}
                                        {formatDateTime(selectedReconciliation.reconciled_at)}
                                    </p>
                                )}
                                {selectedReconciliation.notes && (
                                    <p className="text-sm">
                                        <span className="font-medium">Notes:</span> {selectedReconciliation.notes}
                                    </p>
                                )}
                            </div>

                            {/* 90-Day Warning */}
                            {selectedReconciliation.reconciled_at && 
                             isOlderThan90Days(selectedReconciliation.reconciled_at) && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        This reconciliation is older than 90 days. Undoing it may require elevated permissions
                                        and should be done with caution.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Reason Input */}
                            <div className="space-y-2">
                                <Label htmlFor="undo-reason">Reason for Undo *</Label>
                                <Textarea
                                    id="undo-reason"
                                    placeholder="Explain why this reconciliation needs to be undone..."
                                    value={undoReason}
                                    onChange={(e) => setUndoReason(e.target.value)}
                                    rows={3}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    This action will be logged with your user identifier and timestamp.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUndoDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleUndoReconciliation}
                            disabled={isProcessing || !undoReason.trim()}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Undoing...
                                </>
                            ) : (
                                <>
                                    <Undo2 className="h-4 w-4 mr-2" />
                                    Undo Reconciliation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
