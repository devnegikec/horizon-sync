import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { UnreconciledTransaction, UnreconciledJournalEntry } from '../types';

interface ManualReconciliationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTransaction: UnreconciledTransaction | null;
    availableJournalEntries: UnreconciledJournalEntry[];
    currency: string;
    onConfirm: (
        transactionId: string,
        journalEntryIds: string[],
        notes?: string
    ) => Promise<void>;
}

export function ManualReconciliationDialog({
    open,
    onOpenChange,
    selectedTransaction,
    availableJournalEntries,
    currency,
    onConfirm,
}: ManualReconciliationDialogProps) {
    const [selectedJournalEntryIds, setSelectedJournalEntryIds] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !selectedTransaction) {
            setSelectedJournalEntryIds(new Set());
            setNotes('');
            setError(null);
        }
    }, [open, selectedTransaction]);


    const selectedJournalEntriesSum = useMemo(() => {
        return availableJournalEntries
            .filter(entry => selectedJournalEntryIds.has(entry.id))
            .reduce((sum, entry) => sum + entry.amount, 0);
    }, [availableJournalEntries, selectedJournalEntryIds]);

    const difference = useMemo(() => {
        if (!selectedTransaction) return 0;
        return Math.abs(selectedTransaction.transaction_amount) - selectedJournalEntriesSum;
    }, [selectedTransaction, selectedJournalEntriesSum]);

    const amountsMatch = useMemo(() => {
        return Math.abs(difference) < 0.01;
    }, [difference]);

    const handleJournalEntryToggle = (entryId: string) => {
        const newSelection = new Set(selectedJournalEntryIds);
        if (newSelection.has(entryId)) {
            newSelection.delete(entryId);
        } else {
            newSelection.add(entryId);
        }
        setSelectedJournalEntryIds(newSelection);
        setError(null);
    };

    const handleConfirm = async () => {
        if (!selectedTransaction) return;

        if (selectedJournalEntryIds.size === 0) {
            setError('Please select at least one journal entry');
            return;
        }

        if (!amountsMatch) {
            setError('Amounts do not match. Please adjust your selection.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onConfirm(
                selectedTransaction.id,
                Array.from(selectedJournalEntryIds),
                notes || undefined
            );
            onOpenChange(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create reconciliation';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!selectedTransaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manual Reconciliation</DialogTitle>
                    <DialogDescription>
                        Select one or more journal entries to match with the bank transaction
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-medium mb-3">Bank Transaction</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="text-sm font-medium">
                                    {formatDate(selectedTransaction.statement_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Amount</p>
                                <p className={`text-sm font-semibold ${
                                    selectedTransaction.transaction_type === 'credit' 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                }`}>
                                    {formatCurrency(selectedTransaction.transaction_amount)}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Description</p>
                                <p className="text-sm">
                                    {selectedTransaction.transaction_description || 'N/A'}
                                </p>
                            </div>
                            {selectedTransaction.bank_reference && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">Reference</p>
                                    <p className="text-sm">{selectedTransaction.bank_reference}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium">
                                Available Journal Entries
                            </h3>
                            {selectedJournalEntryIds.size > 0 && (
                                <Badge variant="secondary">
                                    {selectedJournalEntryIds.size} selected
                                </Badge>
                            )}
                        </div>

                        <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                            {availableJournalEntries.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <p>No unreconciled journal entries available</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {availableJournalEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-3 hover:bg-muted/50 cursor-pointer ${
                                                selectedJournalEntryIds.has(entry.id) ? 'bg-muted' : ''
                                            }`}
                                            onClick={() => handleJournalEntryToggle(entry.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedJournalEntryIds.has(entry.id)}
                                                    onCheckedChange={() => handleJournalEntryToggle(entry.id)}
                                                />
                                                <div className="flex-1 grid grid-cols-4 gap-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Date</p>
                                                        <p className="text-sm">{formatDate(entry.posting_date)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Entry No</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {entry.entry_no}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Account</p>
                                                        <p className="text-sm truncate" title={entry.account_name}>
                                                            {entry.account_code}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Amount</p>
                                                        <p className="text-sm font-semibold">
                                                            {formatCurrency(entry.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedJournalEntryIds.size > 0 && (
                        <div className="p-4 bg-muted rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Bank Transaction Amount:</span>
                                <span className="font-semibold">
                                    {formatCurrency(Math.abs(selectedTransaction.transaction_amount))}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Selected Journal Entries Sum:</span>
                                <span className="font-semibold">
                                    {formatCurrency(selectedJournalEntriesSum)}
                                </span>
                            </div>
                            <div className="border-t pt-3 flex justify-between items-center">
                                <span className="text-sm font-medium">Difference:</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${
                                        amountsMatch ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(Math.abs(difference))}
                                    </span>
                                    {amountsMatch ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                </div>
                            </div>

                            {amountsMatch ? (
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        Amounts match! You can proceed with reconciliation.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Amounts do not match. Please adjust your selection.
                                        Difference: {formatCurrency(Math.abs(difference))}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="reconciliation-notes">Notes (Optional)</Label>
                        <Textarea
                            id="reconciliation-notes"
                            placeholder="Add any notes or remarks about this reconciliation..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={
                            isSubmitting ||
                            selectedJournalEntryIds.size === 0 ||
                            !amountsMatch
                        }
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Reconciliation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
