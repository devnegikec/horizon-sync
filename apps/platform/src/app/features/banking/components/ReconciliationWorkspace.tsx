import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { reconciliationService } from '../services/reconciliationService';
import { useBankAccounts } from '../hooks';
import {
    UnreconciledTransaction,
    UnreconciledJournalEntry,
    BankAccountBalance,
} from '../types';

/**
 * ReconciliationWorkspace Component
 * 
 * Main reconciliation interface component that displays:
 * - Two-panel layout: unreconciled transactions on left, unreconciled journal entries on right
 * - Date range filter
 * - Bank account selector
 * - Bank balance, GL balance, and unreconciled amount
 * 
 * Requirements: 7.1, 7.2, 14.8, 14.9
 */
export function ReconciliationWorkspace() {
    // State for filters
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // State for data
    const [transactions, setTransactions] = useState<UnreconciledTransaction[]>([]);
    const [journalEntries, setJournalEntries] = useState<UnreconciledJournalEntry[]>([]);
    const [balance, setBalance] = useState<BankAccountBalance | null>(null);

    // State for loading and errors
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [isLoadingJournalEntries, setIsLoadingJournalEntries] = useState(false);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch bank accounts
    const { data: bankAccounts, isLoading: isLoadingAccounts } = useBankAccounts({
        active: true,
    });

    // Set default date range (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    }, []);

    // Set default bank account when accounts load
    useEffect(() => {
        if (bankAccounts?.items && bankAccounts.items.length > 0 && !selectedBankAccountId) {
            // Select the primary account or the first account
            const primaryAccount = bankAccounts.items.find((acc) => acc.is_primary);
            setSelectedBankAccountId(primaryAccount?.id || bankAccounts.items[0]?.id || '');
        }
    }, [bankAccounts, selectedBankAccountId]);

    // Load data when filters change
    useEffect(() => {
        if (selectedBankAccountId && dateFrom && dateTo) {
            loadData();
        }
    }, [selectedBankAccountId, dateFrom, dateTo]);

    const loadData = async () => {
        if (!selectedBankAccountId || !dateFrom || !dateTo) {
            return;
        }

        setError(null);

        try {
            // Find the selected bank account to get GL account ID
            const selectedAccount = bankAccounts?.items?.find((acc) => acc.id === selectedBankAccountId);
            if (!selectedAccount) {
                setError('Selected bank account not found');
                return;
            }

            // Load unreconciled transactions
            setIsLoadingTransactions(true);
            const transactionsData = await reconciliationService.getUnreconciledTransactions(
                selectedBankAccountId,
                dateFrom,
                dateTo
            );
            setTransactions(transactionsData);
            setIsLoadingTransactions(false);

            // Load unreconciled journal entries
            setIsLoadingJournalEntries(true);
            const journalEntriesData = await reconciliationService.getUnreconciledJournalEntries(
                selectedAccount.gl_account_id,
                dateFrom,
                dateTo
            );
            setJournalEntries(journalEntriesData);
            setIsLoadingJournalEntries(false);

            // Load balance information
            setIsLoadingBalance(true);
            const balanceData = await reconciliationService.getBankAccountBalance(
                selectedBankAccountId
            );
            setBalance(balanceData);
            setIsLoadingBalance(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load reconciliation data';
            setError(errorMessage);
            setIsLoadingTransactions(false);
            setIsLoadingJournalEntries(false);
            setIsLoadingBalance(false);
        }
    };

    const handleRefresh = () => {
        loadData();
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Bank Reconciliation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Bank Account Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select
                                value={selectedBankAccountId}
                                onValueChange={setSelectedBankAccountId}
                                disabled={isLoadingAccounts}
                            >
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bankAccounts?.items?.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.bank_name} - {account.account_holder_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-2">
                            <Label htmlFor="date-from">Date From</Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                            <Label htmlFor="date-to">Date To</Label>
                            <Input
                                id="date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>

                        {/* Refresh Button */}
                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button
                                onClick={handleRefresh}
                                disabled={!selectedBankAccountId || !dateFrom || !dateTo}
                                className="w-full"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Balance Summary */}
            {balance && (
                <Card>
                    <CardHeader>
                        <CardTitle>Balance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Bank Balance</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {isLoadingBalance ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        formatCurrency(balance.bank_balance, balance.currency)
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">GL Balance</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {isLoadingBalance ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        formatCurrency(balance.gl_balance, balance.currency)
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Unreconciled Amount</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {isLoadingBalance ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        formatCurrency(balance.unreconciled_amount, balance.currency)
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Unreconciled Items</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {isLoadingBalance ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        balance.unreconciled_transaction_count
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Panel: Unreconciled Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Unreconciled Transactions
                            <Badge variant="secondary" className="ml-2">
                                {transactions.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingTransactions ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No unreconciled transactions found
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow key={transaction.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    {formatDate(transaction.statement_date)}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {transaction.transaction_description || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {transaction.bank_reference || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span
                                                        className={
                                                            transaction.transaction_type === 'credit'
                                                                ? 'text-green-600 font-semibold'
                                                                : 'text-red-600 font-semibold'
                                                        }
                                                    >
                                                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                                                        {formatCurrency(Math.abs(transaction.transaction_amount), balance?.currency)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Unreconciled Journal Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Unreconciled Journal Entries
                            <Badge variant="secondary" className="ml-2">
                                {journalEntries.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoadingJournalEntries ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Loading journal entries...</p>
                            </div>
                        ) : journalEntries.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No unreconciled journal entries found
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Entry No</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {journalEntries.map((entry) => (
                                            <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    {formatDate(entry.posting_date)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{entry.entry_no}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {entry.reference_id || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-semibold">
                                                        {formatCurrency(entry.amount, balance?.currency)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
