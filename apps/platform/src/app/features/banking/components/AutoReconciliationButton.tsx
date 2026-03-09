import { useState } from 'react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Loader2, Play, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService';

interface AutoReconciliationButtonProps {
    bankAccountId: string;
    dateFrom: string;
    dateTo: string;
    onComplete?: () => void;
    disabled?: boolean;
}

interface AutoReconciliationResult {
    exact_matches: number;
    fuzzy_matches: number;
    many_to_one_matches: number;
    total_processed: number;
    total_reconciled: number;
}

/**
 * AutoReconciliationButton Component
 * 
 * Triggers the auto-reconciliation process and displays results.
 * Shows a progress indicator while running and then displays a summary
 * of matches found (exact, fuzzy, and many-to-one).
 * 
 * Requirements: 8.1-8.10, 9.1-9.10, 10.10
 */
export function AutoReconciliationButton({
    bankAccountId,
    dateFrom,
    dateTo,
    onComplete,
    disabled = false,
}: AutoReconciliationButtonProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    const [results, setResults] = useState<AutoReconciliationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunAutoReconciliation = async () => {
        setIsRunning(true);
        setError(null);

        try {
            const result = await reconciliationService.runAutoReconciliation(
                bankAccountId,
                dateFrom,
                dateTo
            );
            
            setResults(result);
            setShowResultsDialog(true);
            
            if (onComplete) {
                onComplete();
            }
        } catch (err) {
            const errorMessage = err instanceof Error 
                ? err.message 
                : 'Failed to run auto-reconciliation';
            setError(errorMessage);
        } finally {
            setIsRunning(false);
        }
    };

    const handleCloseDialog = () => {
        setShowResultsDialog(false);
        setResults(null);
    };

    return (
        <>
            <Button
                onClick={handleRunAutoReconciliation}
                disabled={disabled || isRunning || !bankAccountId || !dateFrom || !dateTo}
                className="w-full"
            >
                {isRunning ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running Auto-Reconciliation...
                    </>
                ) : (
                    <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Auto-Reconciliation
                    </>
                )}
            </Button>

            {error && (
                <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Results Dialog */}
            <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                            Auto-Reconciliation Complete
                        </DialogTitle>
                        <DialogDescription>
                            The auto-reconciliation process has finished. Here's a summary of the results.
                        </DialogDescription>
                    </DialogHeader>

                    {results && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                                            <p className="text-3xl font-bold text-blue-700 mt-1">
                                                {results.total_processed}
                                            </p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-blue-400" />
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Total Reconciled</p>
                                            <p className="text-3xl font-bold text-green-700 mt-1">
                                                {results.total_reconciled}
                                            </p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Match Type Breakdown */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Match Type Breakdown
                                </h4>

                                {/* Exact Matches */}
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Exact Matches</p>
                                            <p className="text-xs text-muted-foreground">
                                                Amount, date, and reference all match exactly
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                                        {results.exact_matches}
                                    </Badge>
                                </div>

                                {/* Fuzzy Matches */}
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Fuzzy Matches (Suggested)</p>
                                            <p className="text-xs text-muted-foreground">
                                                Probable matches requiring manual confirmation
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-yellow-600 text-white text-lg px-3 py-1">
                                        {results.fuzzy_matches}
                                    </Badge>
                                </div>

                                {/* Many-to-One Matches */}
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                            <svg
                                                className="h-5 w-5 text-purple-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium">Many-to-One Matches (Suggested)</p>
                                            <p className="text-xs text-muted-foreground">
                                                Multiple journal entries matching one transaction
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
                                        {results.many_to_one_matches}
                                    </Badge>
                                </div>
                            </div>

                            {/* Success Rate */}
                            {results.total_processed > 0 && (
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Success Rate</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Transactions automatically reconciled
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-700">
                                                {Math.round((results.total_reconciled / results.total_processed) * 100)}%
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {results.total_reconciled} of {results.total_processed}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Next Steps */}
                            {(results.fuzzy_matches > 0 || results.many_to_one_matches > 0) && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Next Steps:</strong> Review the suggested matches in the "Suggested Matches" 
                                        section below. You can confirm or reject each suggestion based on your review.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Close Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleCloseDialog}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
