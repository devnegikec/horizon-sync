import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Input } from '@horizon-sync/ui/components/ui/input';
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
import { reconciliationService } from '../services/reconciliationService';
import { ReconciliationReportData, ReconciliationReportFilters, ReconciliationReportTransaction } from '../types';
import { 
    Calendar, 
    Download,
    FileText,
    Filter,
    Loader2,
    ArrowDownCircle,
    ArrowUpCircle,
} from 'lucide-react';

interface ReconciliationReportProps {
    bankAccountId?: string;
}

export function ReconciliationReport({ bankAccountId }: ReconciliationReportProps) {
    const [reportData, setReportData] = useState<ReconciliationReportData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);

    // Filter state
    const [filters, setFilters] = useState<ReconciliationReportFilters>({
        bank_account_id: bankAccountId,
        status: 'all',
    });

    // Grouped transactions by status
    const [groupedTransactions, setGroupedTransactions] = useState<{
        reconciled: ReconciliationReportTransaction[];
        cleared: ReconciliationReportTransaction[];
        pending: ReconciliationReportTransaction[];
        void: ReconciliationReportTransaction[];
    }>({
        reconciled: [],
        cleared: [],
        pending: [],
        void: [],
    });

    // Load report data
    const loadReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await reconciliationService.getReconciliationReport(filters);
            setReportData(data);

            // Group transactions by status
            const grouped = {
                reconciled: data.transactions.filter(t => t.transaction_status === 'reconciled'),
                cleared: data.transactions.filter(t => t.transaction_status === 'cleared'),
                pending: data.transactions.filter(t => t.transaction_status === 'pending'),
                void: data.transactions.filter(t => t.transaction_status === 'void'),
            };
            setGroupedTransactions(grouped);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load report');
        } finally {
            setIsLoading(false);
        }
    };

    // Load report on mount and when filters change
    useEffect(() => {
        if (filters.bank_account_id && filters.date_from && filters.date_to) {
            loadReport();
        }
    }, [filters]);

    // Handle filter changes
    const handleBankAccountChange = (value: string) => {
        setFilters(prev => ({ ...prev, bank_account_id: value }));
    };

    const handleDateFromChange = (value: string) => {
        setFilters(prev => ({ ...prev, date_from: value }));
    };

    const handleDateToChange = (value: string) => {
        setFilters(prev => ({ ...prev, date_to: value }));
    };

    const handleStatusChange = (value: string) => {
        setFilters(prev => ({ 
            ...prev, 
            status: value as ReconciliationReportFilters['status']
        }));
    };

    // Export handlers
    const handleExportCSV = async () => {
        setIsExporting('csv');
        try {
            const blob = await reconciliationService.exportReportToCSV(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export CSV');
        } finally {
            setIsExporting(null);
        }
    };

    const handleExportPDF = async () => {
        setIsExporting('pdf');
        try {
            const blob = await reconciliationService.exportReportToPDF(filters);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export PDF');
        } finally {
            setIsExporting(null);
        }
    };

    // Format currency
    const formatAmount = (amount: number, type: 'debit' | 'credit') => {
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Math.abs(amount));
        
        return type === 'debit' ? `-${formatted}` : formatted;
    };

    // Format date
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Format timestamp
    const formatTimestamp = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    // Get status badge variant
    const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
        switch (status) {
            case 'reconciled':
                return 'default';
            case 'cleared':
                return 'secondary';
            case 'pending':
                return 'outline';
            case 'void':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    // Render transaction table
    const renderTransactionTable = (transactions: ReconciliationReportTransaction[], title: string) => {
        if (transactions.length === 0) return null;

        return (
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">{title} ({transactions.length})</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Matched Journal Entry</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(transaction.statement_date)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="max-w-xs truncate">
                                            {transaction.transaction_description || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {transaction.bank_reference || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        <div className="flex items-center justify-end gap-2">
                                            {transaction.transaction_type === 'debit' ? (
                                                <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                            ) : (
                                                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                            )}
                                            <span className={
                                                transaction.transaction_type === 'debit' 
                                                    ? 'text-red-600' 
                                                    : 'text-green-600'
                                            }>
                                                {formatAmount(
                                                    transaction.transaction_amount,
                                                    transaction.transaction_type
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(transaction.transaction_status)}>
                                            {transaction.transaction_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {transaction.matched_journal_entry ? (
                                            <div className="text-sm">
                                                <div className="font-medium">
                                                    {transaction.matched_journal_entry.entry_no}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {formatDate(transaction.matched_journal_entry.posting_date)}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reconciliation Report
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Bank Account - if not pre-selected */}
                        {!bankAccountId && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Bank Account</label>
                                <Input
                                    placeholder="Bank Account ID"
                                    value={filters.bank_account_id || ''}
                                    onChange={(e) => handleBankAccountChange(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Date From */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">From Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleDateFromChange(e.target.value)}
                                    className="pl-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">To Date</label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleDateToChange(e.target.value)}
                                    className="pl-10"
                                />
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select 
                                value={filters.status || 'all'} 
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="reconciled">Reconciled</SelectItem>
                                    <SelectItem value="cleared">Cleared</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="void">Void</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Generate Report Button */}
                    <Button 
                        onClick={loadReport} 
                        disabled={isLoading || !filters.bank_account_id || !filters.date_from || !filters.date_to}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Report'
                        )}
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                        {error}
                    </div>
                )}

                {/* Report Content */}
                {reportData && (
                    <div className="space-y-6">
                        {/* Report Header */}
                        <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                            <div>
                                <h3 className="font-semibold">{reportData.bank_account_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(reportData.date_from)} - {formatDate(reportData.date_to)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Generated: {formatTimestamp(reportData.generated_at)} by {reportData.generated_by}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportCSV}
                                    disabled={isExporting !== null}
                                >
                                    {isExporting === 'csv' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExportPDF}
                                    disabled={isExporting !== null}
                                >
                                    {isExporting === 'pdf' ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export PDF
                                </Button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Imported
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {reportData.summary.total_imported}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(reportData.summary.total_amount_imported)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Reconciled
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {reportData.summary.total_reconciled}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(reportData.summary.total_amount_reconciled)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total Unreconciled
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {reportData.summary.total_unreconciled}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        }).format(reportData.summary.total_amount_unreconciled)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Grouped Transactions */}
                        <div className="space-y-6">
                            {renderTransactionTable(groupedTransactions.reconciled, 'Reconciled Transactions')}
                            {renderTransactionTable(groupedTransactions.cleared, 'Cleared Transactions')}
                            {renderTransactionTable(groupedTransactions.pending, 'Pending Transactions')}
                            {renderTransactionTable(groupedTransactions.void, 'Void Transactions')}
                        </div>

                        {/* No transactions message */}
                        {reportData.transactions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No transactions found for the selected filters
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
