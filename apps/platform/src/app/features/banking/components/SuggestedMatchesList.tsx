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
import { Loader2, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService';
import { SuggestedMatch } from '../types';

interface SuggestedMatchesListProps {
    bankAccountId?: string;
    dateFrom?: string;
    dateTo?: string;
    onMatchConfirmed?: () => void;
    onMatchRejected?: () => void;
}

/**
 * SuggestedMatchesList Component
 * 
 * Displays suggested reconciliation matches from auto-reconciliation service.
 * Shows match confidence scores and matching criteria.
 * Allows users to confirm or reject suggested matches.
 * 
 * Requirements: 9.1-9.10
 */
export function SuggestedMatchesList({
    bankAccountId,
    dateFrom,
    dateTo,
    onMatchConfirmed,
    onMatchRejected,
}: SuggestedMatchesListProps) {
    const [matches, setMatches] = useState<SuggestedMatch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dialog states
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<SuggestedMatch | null>(null);
    const [confirmNotes, setConfirmNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadSuggestedMatches();
    }, [bankAccountId, dateFrom, dateTo]);

    const loadSuggestedMatches = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await reconciliationService.getSuggestedMatches(
                bankAccountId,
                dateFrom,
                dateTo
            );
            setMatches(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load suggested matches';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmClick = (match: SuggestedMatch) => {
        setSelectedMatch(match);
        setConfirmNotes('');
        setConfirmDialogOpen(true);
    };

    const handleRejectClick = (match: SuggestedMatch) => {
        setSelectedMatch(match);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const handleConfirmMatch = async () => {
        if (!selectedMatch) return;

        setIsProcessing(true);
        try {
            await reconciliationService.confirmSuggestedMatch(
                selectedMatch.id,
                confirmNotes || undefined
            );
            
            // Remove the confirmed match from the list
            setMatches(matches.filter(m => m.id !== selectedMatch.id));
            setConfirmDialogOpen(false);
            setSelectedMatch(null);
            setConfirmNotes('');
            
            if (onMatchConfirmed) {
                onMatchConfirmed();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to confirm match';
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectMatch = async () => {
        if (!selectedMatch || !rejectReason.trim()) return;

        setIsProcessing(true);
        try {
            await reconciliationService.rejectSuggestedMatch(
                selectedMatch.id,
                rejectReason
            );
            
            // Remove the rejected match from the list
            setMatches(matches.filter(m => m.id !== selectedMatch.id));
            setRejectDialogOpen(false);
            setSelectedMatch(null);
            setRejectReason('');
            
            if (onMatchRejected) {
                onMatchRejected();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reject match';
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

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.9) {
            return <Badge className="bg-green-500">High ({Math.round(confidence * 100)}%)</Badge>;
        } else if (confidence >= 0.7) {
            return <Badge className="bg-yellow-500">Medium ({Math.round(confidence * 100)}%)</Badge>;
        } else {
            return <Badge className="bg-orange-500">Low ({Math.round(confidence * 100)}%)</Badge>;
        }
    };

    const getMatchingCriteriaBadges = (criteria: SuggestedMatch['matching_criteria']) => {
        return (
            <div className="flex flex-wrap gap-1">
                {criteria.amount_match && (
                    <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Amount
                    </Badge>
                )}
                {criteria.date_match && (
                    <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Date
                        {criteria.date_difference_days !== undefined && criteria.date_difference_days > 0 && (
                            <span className="ml-1">({criteria.date_difference_days}d)</span>
                        )}
                    </Badge>
                )}
                {criteria.reference_match && (
                    <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reference
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Suggested Matches
                        </span>
                        <Badge variant="secondary">{matches.length}</Badge>
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
                            <p className="mt-2 text-sm text-muted-foreground">Loading suggested matches...</p>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p>No suggested matches found</p>
                            <p className="text-sm mt-2">Run auto-reconciliation to generate suggestions</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bank Transaction</TableHead>
                                        <TableHead>Journal Entry</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Confidence</TableHead>
                                        <TableHead>Matching Criteria</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matches.map((match) => (
                                        <TableRow key={match.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-sm">
                                                        {formatDate(match.bank_transaction.statement_date)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {match.bank_transaction.transaction_description || 'N/A'}
                                                    </p>
                                                    {match.bank_transaction.bank_reference && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Ref: {match.bank_transaction.bank_reference}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {match.journal_entry.entry_no}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(match.journal_entry.posting_date)}
                                                    </p>
                                                    {match.journal_entry.reference_id && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Ref: {match.journal_entry.reference_id}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="font-semibold">
                                                        {formatCurrency(match.bank_transaction.transaction_amount)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        JE: {formatCurrency(match.journal_entry.amount)}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getConfidenceBadge(match.match_confidence)}
                                            </TableCell>
                                            <TableCell>
                                                {getMatchingCriteriaBadges(match.matching_criteria)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleConfirmClick(match)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleRejectClick(match)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Suggested Match</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to confirm this reconciliation match?
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedMatch && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Bank Transaction</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(selectedMatch.bank_transaction.statement_date)}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedMatch.bank_transaction.transaction_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Journal Entry</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedMatch.journal_entry.entry_no}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedMatch.journal_entry.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-notes">Notes (Optional)</Label>
                                <Textarea
                                    id="confirm-notes"
                                    placeholder="Add any notes about this reconciliation..."
                                    value={confirmNotes}
                                    onChange={(e) => setConfirmNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmMatch}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm Match
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Suggested Match</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this match.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedMatch && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">Bank Transaction</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(selectedMatch.bank_transaction.statement_date)}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedMatch.bank_transaction.transaction_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Journal Entry</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedMatch.journal_entry.entry_no}
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedMatch.journal_entry.amount)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reject-reason">Reason *</Label>
                                <Textarea
                                    id="reject-reason"
                                    placeholder="Explain why this match is incorrect..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectMatch}
                            disabled={isProcessing || !rejectReason.trim()}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Match
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
