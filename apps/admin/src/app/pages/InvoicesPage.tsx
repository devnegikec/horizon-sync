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
    Tabs,
    TabsContent,
    TabsList,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import {
    Search,
    Filter,
    Download,
    Plus,
    Eye,
    FileText,
    DollarSign,
    Calendar,
    User,
    Building2,
} from 'lucide-react';

import { useInvoices } from '../hooks/useInvoices';
import { AdminInvoiceService } from '../services/admin-invoice.service';
import { AdminOrganizationService } from '../services/admin-organization.service';
import { CreateInvoiceModal } from '../components/billing/CreateInvoiceModal';
import { InvoiceDetailModal } from '../components/billing/InvoiceDetailModal';
import type { Invoice, SubscriptionInvoiceResponse, AdminInvoiceFilters, AdminOrgListItem } from '../types';

export function InvoicesPage() {
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
    const [orgsLoading, setOrgsLoading] = useState(false);
    const [filters, setFilters] = useState<AdminInvoiceFilters>({
        page: 1,
        page_size: 20,
        search: '',
        status: '',
        organization_id: '',
        date_from: '',
        date_to: '',
    });

    const { toast } = useToast();

    // Use the new React Query hook
    const {
        data,
        isLoading,
        isError,
        refetch
    } = useInvoices(filters);

    // Fetch organizations for filter dropdown
    useEffect(() => {
        setOrgsLoading(true);
        AdminOrganizationService.list({ page: 1, page_size: 100 })
            .then((res) => setOrgOptions(res.organizations.map((o: AdminOrgListItem) => ({ id: o.id, name: o.name }))))
            .catch(() => setOrgOptions([]))
            .finally(() => setOrgsLoading(false));
    }, []);

    const handleOrgSearch = (query: string) => {
        setOrgsLoading(true);
        AdminOrganizationService.list({ search: query, page: 1, page_size: 50 })
            .then((res) => setOrgOptions(res.organizations.map((o: AdminOrgListItem) => ({ id: o.id, name: o.name }))))
            .catch(() => { })
            .finally(() => setOrgsLoading(false));
    };

    // Extract data from React Query response
    const invoices = data?.invoices ?? [];
    const pagination = data?.pagination;

    const handleCreateInvoice = async (invoiceData: any) => {
        try {
            await AdminInvoiceService.createInvoice(invoiceData);
            refetch(); // Refresh the list using React Query
            setShowCreateModal(false);
            toast({
                title: 'Success',
                description: 'Invoice created successfully',
            });
        } catch (error) {
            console.error('Failed to create invoice:', error);
            throw error; // Re-throw to handle in modal
        }
    };

    const handleFilterChange = (key: keyof AdminInvoiceFilters, value: string | number) => {
        setFilters((prev: AdminInvoiceFilters) => ({
            ...prev,
            [key]: value === 'all' ? undefined : value,
            // Reset page to 1 when filters change
            page: key === 'page' ? (value as number) : 1,
        } as AdminInvoiceFilters));
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { variant: 'secondary' as const, label: 'Draft' },
            sent: { variant: 'default' as const, label: 'Sent' },
            paid: { variant: 'success' as const, label: 'Paid' },
            overdue: { variant: 'destructive' as const, label: 'Overdue' },
            cancelled: { variant: 'outline' as const, label: 'Cancelled' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || {
            variant: 'secondary' as const,
            label: status,
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
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

    const convertToSubscriptionInvoiceResponse = (invoice: Invoice): SubscriptionInvoiceResponse => {
        return {
            id: invoice.id,
            invoice_number: invoice.invoice_no || invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`,
            organization_id: invoice.organization_id,
            invoice_type: invoice.invoice_type,
            subscription_tier: invoice.subscription_tier || 'basic',
            billing_period_start: invoice.posting_date || invoice.issue_date || new Date().toISOString().split('T')[0],
            billing_period_end: invoice.due_date || new Date().toISOString().split('T')[0],
            amount: invoice.grand_total || invoice.total_amount || 0,
            status: invoice.status,
            due_date: invoice.due_date || new Date().toISOString().split('T')[0],
            created_date: invoice.created_at,
            paid_date: invoice.paid_date,
            description: invoice.description,
            line_items: invoice.line_items,
        };
    };

    const handleInvoiceAction = async (action: string, invoiceId: string, data?: any) => {
        try {
            switch (action) {
                case 'mark-sent':
                    await AdminInvoiceService.sendInvoice(invoiceId);
                    toast({
                        title: 'Success',
                        description: 'Invoice marked as sent',
                    });
                    break;
                case 'mark-paid':
                    const paymentData = {
                        payment_date: new Date().toISOString(),
                        payment_method: data?.payment_method || 'manual',
                        reference: data?.reference || '',
                        notes: data?.notes || 'Marked as paid via admin panel'
                    };
                    await AdminInvoiceService.markAsPaid(invoiceId, paymentData);
                    toast({
                        title: 'Success',
                        description: 'Invoice marked as paid',
                    });
                    break;
                case 'create-payment':
                    // This would require integration with payment service
                    toast({
                        title: 'Info',
                        description: 'Payment creation feature coming soon',
                    });
                    break;
            }
            refetch(); // Refresh using React Query
        } catch (error) {
            console.error(`Failed to ${action}:`, error);
            toast({
                title: 'Error',
                description: `Failed to ${action}`,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">
                        Manage customer invoices and billing
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">{pagination?.total_items ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Total Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        invoices
                                            .filter((i: Invoice) => i.status === 'paid')
                                            .reduce((sum: number, i: Invoice) => sum + (i.grand_total || i.total_amount || 0), 0)
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">Paid Amount</p>
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
                                    {invoices.filter((i: Invoice) => i.status === 'sent').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {invoices.filter((i: Invoice) => i.status === 'overdue').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Overdue</p>
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
                                placeholder="Search invoices..."
                                className="pl-8"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => handleFilterChange('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.organization_id || 'all'}
                            onValueChange={(value) => handleFilterChange('organization_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Organization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Organizations</SelectItem>
                                {orgOptions.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            placeholder="From Date"
                            value={filters.date_from || ''}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        />
                        <Input
                            type="date"
                            placeholder="To Date"
                            value={filters.date_to || ''}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        />
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Organization</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Issue Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Loading invoices...
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice: Invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">
                                            {invoice.invoice_no || invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{invoice.organization_name || 'Unknown'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(invoice.grand_total || invoice.total_amount || 0)}</TableCell>
                                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                        <TableCell>{formatDate(invoice.posting_date || invoice.issue_date || invoice.created_at)}</TableCell>
                                        <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedInvoice(invoice)}
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
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing page {pagination.page} of {pagination.total_pages} ({pagination.total_items} total)
                    </p>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => handleFilterChange('page', pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.total_pages}
                            onClick={() => handleFilterChange('page', pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateInvoiceModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateInvoice}
                />
            )}

            {selectedInvoice && (
                <InvoiceDetailModal
                    invoice={selectedInvoice}
                    isOpen={!!selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onAction={handleInvoiceAction}
                />
            )}
        </div>
    );
}