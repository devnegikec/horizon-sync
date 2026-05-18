import React, { useState, useEffect } from 'react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Input,
    Badge,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components';
import {
    Search,
    Filter,
    Download,
    Plus,
    Eye,
    CreditCard,
    DollarSign,
    Calendar,
    Building2,
    CheckCircle,
} from 'lucide-react';

import { AdminPaymentService } from '../services/admin-payment.service';
import type { Payment } from '../types/billing.types';
import { useCurrencyStore } from '@horizon-sync/store';
import { getCurrencySymbol } from '@horizon-sync/ui';
import { CurrencyIcon } from '@horizon-sync/ui';

interface PaymentFilter {
    search: string;
    status: string;
    payment_method: string;
    organization_id: string;
    date_from: string;
    date_to: string;
}

export function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
    const currencySymbol = getCurrencySymbol(baseCurrency || 'INR');
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalCount: 0,
    });
    const [filters, setFilters] = useState<PaymentFilter>({
        search: '',
        status: '',
        payment_method: '',
        organization_id: '',
        date_from: '',
        date_to: '',
    });

    useEffect(() => {
        loadPayments();
    }, [filters, pagination.page]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const response = await AdminPaymentService.getPayments({
                page: pagination.page,
                page_size: 20,
                ...filters,
            });
            setPayments(response.payments);
            setPagination({
                page: response.page,
                totalPages: response.total_pages,
                totalCount: response.total_count,
            });
        } catch (error) {
            console.error('Failed to load payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending' },
            completed: { variant: 'success' as const, label: 'Completed' },
            failed: { variant: 'destructive' as const, label: 'Failed' },
            refunded: { variant: 'outline' as const, label: 'Refunded' },
            cancelled: { variant: 'outline' as const, label: 'Cancelled' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            variant: 'secondary' as const,
            label: status,
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPaymentMethodBadge = (method: string) => {
        const methodConfig = {
            credit_card: { label: 'Credit Card', icon: CreditCard },
            bank_transfer: { label: 'Bank Transfer', icon: Building2 },
            cash: { label: 'Cash', icon: CurrencyIcon },
            check: { label: 'Check', icon: CheckCircle },
        };

        const config = methodConfig[method as keyof typeof methodConfig] || {
            label: method,
            icon: CreditCard,
        };

        const Icon = config.icon;

        return (
            <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{config.label}</span>
            </div>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                    <p className="text-muted-foreground">
                        Track and manage customer payments
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">{pagination.totalCount}</p>
                                <p className="text-xs text-muted-foreground">Total Payments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <span className="h-4 w-4 inline-flex items-center justify-center text-sm font-bold mr-2">{currencySymbol}</span>
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        payments
                                            .filter(p => p.status === 'completed')
                                            .reduce((sum, p) => sum + p.amount, 0)
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">Total Received</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {payments.filter(p => p.status === 'pending').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5 text-red-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {payments.filter(p => p.status === 'failed').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-6">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search payments..."
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.payment_method || 'all'}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, payment_method: value === 'all' ? '' : value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            placeholder="From Date"
                            value={filters.date_from}
                            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                        />
                        <Input
                            type="date"
                            placeholder="To Date"
                            value={filters.date_to}
                            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                        />
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment #</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading payments...
                                    </TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        No payments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            {payment.transaction_id || `PAY-${payment.id.slice(0, 8)}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{payment.organization_name || 'Unknown'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedPayment(payment)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                    </p>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Payment Detail Modal */}
            {selectedPayment && (
                <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                                Payment ID: {selectedPayment.transaction_id || selectedPayment.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Organization</label>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.organization_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Amount</label>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Payment Method</label>
                                    <div className="text-sm text-muted-foreground">{getPaymentMethodBadge(selectedPayment.payment_method)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="text-sm">{getStatusBadge(selectedPayment.status)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Payment Date</label>
                                    <p className="text-sm text-muted-foreground">{formatDate(selectedPayment.payment_date)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Reference</label>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.reference || 'N/A'}</p>
                                </div>
                            </div>
                            {selectedPayment.notes && (
                                <div>
                                    <label className="text-sm font-medium">Notes</label>
                                    <p className="text-sm text-muted-foreground">{selectedPayment.notes}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}