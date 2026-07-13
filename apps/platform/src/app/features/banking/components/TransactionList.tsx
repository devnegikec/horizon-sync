import { useState } from 'react';
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
import { useBankTransactions } from '../hooks';
import { TransactionFilterParams } from '../types';
import { 
    ArrowDownCircle, 
    ArrowUpCircle, 
    Calendar, 
    ChevronLeft, 
    ChevronRight,
    Search,
    AlertTriangle
} from 'lucide-react';

interface TransactionListProps {
    bankAccountId: string;
}

export function TransactionList({ bankAccountId }: TransactionListProps) {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [filters, setFilters] = useState<TransactionFilterParams>({});
    const [searchInput, setSearchInput] = useState('');

    const { data, isLoading, error } = useBankTransactions(
        bankAccountId,
        page,
        pageSize,
        filters
    );

    // Handle filter changes
    const handleStatusFilter = (value: string) => {
        setFilters(prev => ({
            ...prev,
            status: value === 'all' ? undefined : value as TransactionFilterParams['status']
        }));
        setPage(1);
    };

    const handleTypeFilter = (value: string) => {
        setFilters(prev => ({
            ...prev,
            transaction_type: value === 'all' ? undefined : value as TransactionFilterParams['transaction_type']
        }));
        setPage(1);
    };

    const handleDateFromChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            date_from: value || undefined
        }));
        setPage(1);
    };

    const handleDateToChange = (value: string) => {
        setFilters(prev => ({
            ...prev,
            date_to: value || undefined
        }));
        setPage(1);
    };

    const handleSearch = () => {
        setFilters(prev => ({
            ...prev,
            search: searchInput || undefined
        }));
        setPage(1);
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
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

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-destructive">Error loading transactions: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bank Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Status Filter */}
                    <Select onValueChange={handleStatusFilter} defaultValue="all">
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cleared">Cleared</SelectItem>
                            <SelectItem value="reconciled">Reconciled</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Type Filter */}
                    <Select onValueChange={handleTypeFilter} defaultValue="all">
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date From */}
                    <div className="relative">
                        <Input
                            type="date"
                            placeholder="From Date"
                            onChange={(e) => handleDateFromChange(e.target.value)}
                            className="pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Date To */}
                    <div className="relative">
                        <Input
                            type="date"
                            placeholder="To Date"
                            onChange={(e) => handleDateToChange(e.target.value)}
                            className="pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Search */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={handleSearchKeyPress}
                                className="pl-10"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button onClick={handleSearch} size="icon" variant="secondary">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Transaction Table */}
                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-muted rounded" />
                        <div className="h-12 bg-muted rounded" />
                        <div className="h-12 bg-muted rounded" />
                    </div>
                ) : !data || data.items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No transactions found
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.map((transaction) => (
                                        <TableRow 
                                            key={transaction.id}
                                            className={transaction.is_duplicate ? 'bg-yellow-50' : ''}
                                        >
                                            <TableCell className="font-medium">
                                                {formatDate(transaction.statement_date)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {transaction.is_duplicate && (
                                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                    )}
                                                    <span className="max-w-xs truncate">
                                                        {transaction.transaction_description || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {transaction.bank_reference || '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
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
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {transaction.transaction_type === 'debit' ? (
                                                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                                    )}
                                                    <span className="capitalize">
                                                        {transaction.transaction_type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(transaction.transaction_status)}>
                                                    {transaction.transaction_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {((page - 1) * pageSize) + 1} to{' '}
                                {Math.min(page * pageSize, data.total)} of {data.total} transactions
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {page} of {data.total_pages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                                    disabled={page === data.total_pages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
