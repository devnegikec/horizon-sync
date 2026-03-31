import { useState, useEffect, useMemo } from 'react';

import { Calendar, DollarSign, FileText, TrendingUp, Download, Plus, CreditCard, Filter, MoreHorizontal, Eye, CheckCircle, Mail } from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    SearchInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    DataTable,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { BillingManagementService } from '../services/billing-management.service';
import { AdminInvoiceService } from '../services/admin-invoice.service';
import { PaymentReminderService } from '../services/payment-reminder.service';
import type {
    SubscriptionInvoiceResponse,
    OrganizationBillingInfo,
    BillingSummary,
} from '../types';
import type { Invoice, AdminInvoiceFilters } from '../types/billing.types';
import { CreateInvoiceModal } from '../components/billing/CreateInvoiceModal';
import { InvoiceDetailModal } from '../components/billing/InvoiceDetailModal';
import { OrganizationBillingModal } from '../components/billing/OrganizationBillingModal';

const PAGE_SIZE = 20;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    trend?: {
        value: number;
        label: string;
    };
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
    return (
        <Card className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {trend && (
                            <div className="flex items-center text-sm">
                                <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                                <span className="text-green-500 font-medium">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
                                <span className="text-muted-foreground ml-1">{trend.label}</span>
                            </div>
                        )}
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
                        <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getStatusBadge(status: string) {
    const statusConfig = {
        paid: { variant: 'success' as const, label: 'Paid' },
        pending: { variant: 'warning' as const, label: 'Pending' },
        overdue: { variant: 'destructive' as const, label: 'Overdue' },
        sent: { variant: 'secondary' as const, label: 'Sent' },
        draft: { variant: 'secondary' as const, label: 'Draft' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getTierBadge(tier: string) {
    const tierConfig = {
        basic: { variant: 'secondary' as const, label: 'Basic' },
        pro: { variant: 'secondary' as const, label: 'Pro' },
        enterprise: { variant: 'success' as const, label: 'Enterprise' },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || {
        variant: 'secondary' as const,
        label: tier,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BillingManagementPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [organizationBilling, setOrganizationBilling] = useState<OrganizationBillingInfo[]>([]);
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [tierFilter, setTierFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('30');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState('invoices');

    // Modals
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [selectedOrganization, setSelectedOrganization] = useState<OrganizationBillingInfo | null>(null);

    useEffect(() => {
        loadData();
    }, [page, statusFilter, tierFilter, dateRange, searchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load billing summary
            const summaryData = await BillingManagementService.getBillingSummary();
            setSummary(summaryData);

            // Load invoices with filters - Use AdminInvoiceService
            const invoiceFilters: AdminInvoiceFilters = {
                page,
                page_size: PAGE_SIZE,
            };

            if (statusFilter !== 'all') invoiceFilters.status = statusFilter;
            if (searchQuery) invoiceFilters.search = searchQuery;

            if (dateRange !== 'all') {
                const days = parseInt(dateRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
                startDate.setHours(0, 0, 0, 0); // Start of day
                invoiceFilters.date_from = startDate.toISOString();
            }

            const invoicesData = await AdminInvoiceService.list(invoiceFilters);
            setInvoices(invoicesData.invoices);

            // Load organization billing data
            const orgBillingFilters: any = {
                page,
                page_size: PAGE_SIZE,
            };

            if (tierFilter !== 'all') orgBillingFilters.subscription_tier = tierFilter;
            if (searchQuery) orgBillingFilters.organization_name = searchQuery;

            const orgBillingData = await BillingManagementService.getOrganizationBilling(orgBillingFilters);
            console.log('Organization billing data loaded:', orgBillingData); // Debug log
            setOrganizationBilling(Array.isArray(orgBillingData) ? orgBillingData : []);

        } catch (error) {
            console.error('Failed to load billing data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load billing data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (invoiceData: any) => {
        try {
            await BillingManagementService.createSubscriptionInvoice(invoiceData);
            toast({
                title: 'Success',
                description: 'Invoice created successfully',
            });
            setShowCreateInvoiceModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to create invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to create invoice',
                variant: 'destructive',
            });
        }
    };
    // Individual action handlers
    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleCapturePayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // The InvoiceDetailModal will handle the payment capture
    };

    const handleMarkAsPaid = async (invoice: Invoice) => {
        if (confirm('Are you sure you want to mark this invoice as paid?')) {
            await handleInvoiceAction('mark-paid', invoice.id, {
                amount: invoice.grand_total,
                payment_method: 'other',
                notes: 'Marked as paid via admin panel'
            });
        }
    };

    const handleSendReminder = async (invoice: Invoice) => {
        try {
            // Map reminder stage based on invoice status/age
            let reminderStage: 'first_reminder' | 'second_reminder' | 'final_notice' | 'deactivation_notice';

            if (invoice.status === 'overdue') {
                // For overdue invoices, use appropriate escalation
                reminderStage = 'second_reminder'; // or 'final_notice' based on age
            } else {
                reminderStage = 'first_reminder';
            }

            const result = await PaymentReminderService.sendReminder({
                organization_id: invoice.organization_id,
                invoice_ids: [invoice.id],
                reminder_stage: reminderStage
            });

            if (result.sent) {
                toast({
                    title: 'Reminder Sent Successfully',
                    description: `${reminderStage.replace('_', ' ').toUpperCase()} sent for invoice ${invoice.invoice_no}. ${result.message || ''}`,
                });
                // Refresh the data to update any status changes
                loadData();
            } else {
                toast({
                    title: 'Reminder Not Sent',
                    description: result.message || 'The reminder could not be sent at this time.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to send reminder:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send reminder';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };
    const handleInvoiceAction = async (action: string, invoiceId: string, data?: any) => {
        try {
            switch (action) {
                case 'mark-sent':
                    await BillingManagementService.markInvoiceAsSent(invoiceId);
                    toast({
                        title: 'Success',
                        description: 'Invoice marked as sent',
                    });
                    break;
                case 'mark-paid':
                    await BillingManagementService.markInvoiceAsPaid(invoiceId, data);
                    toast({
                        title: 'Success',
                        description: 'Invoice marked as paid',
                    });
                    break;
                case 'create-payment':
                    await BillingManagementService.createPaymentFromInvoice(invoiceId, data);
                    toast({
                        title: 'Success',
                        description: 'Payment created successfully',
                    });
                    break;
            }
            loadData();
        } catch (error) {
            console.error(`Failed to ${action}:`, error);
            toast({
                title: 'Error',
                description: `Failed to ${action}`,
                variant: 'destructive',
            });
        }
    };

    const invoiceColumns = [
        {
            accessorKey: 'invoice_number',
            header: 'Invoice #',
            cell: ({ row }: any) => (
                <span className="font-medium">{row.original.invoice_no}</span>
            ),
        },
        {
            accessorKey: 'party_name',
            header: 'Customer',
            cell: ({ row }: any) => {
                // Display customer organization name (party_name) rather than master org name
                const customerName = row.original.party_name || row.original.organization_name || 'Unknown';
                const displayName = customerName.replace(/^Organization\s+/i, '').trim();
                return <span className="font-medium">{displayName}</span>;
            },
        },
        {
            accessorKey: 'invoice_type',
            header: 'Type',
            cell: ({ row }: any) => (
                <Badge variant="outline">
                    {row.original.invoice_type.replace(/_/g, ' ').toUpperCase()}
                </Badge>
            ),
        },
        {
            accessorKey: 'subscription_tier',
            header: 'Tier',
            cell: ({ row }: any) => getTierBadge(row.original.subscription_tier),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }: any) => formatCurrency(row.original.grand_total),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: any) => getStatusBadge(row.original.status),
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            cell: ({ row }: any) => formatDate(row.original.due_date),
        },
        {
            accessorKey: 'created_date',
            header: 'Created',
            cell: ({ row }: any) => formatDate(row.original.created_at),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }: any) => {
                const invoice = row.original;
                const canMarkAsPaid = ['sent', 'pending', 'overdue'].includes(invoice.status);
                const canSendReminder = invoice.status === 'overdue';
                const canCapturePayment = ['sent', 'pending', 'overdue'].includes(invoice.status);

                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </DropdownMenuItem>
                                {canCapturePayment && (
                                    <DropdownMenuItem onClick={() => handleCapturePayment(invoice)}>
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Capture Payment
                                    </DropdownMenuItem>
                                )}
                                {canMarkAsPaid && (
                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Paid
                                    </DropdownMenuItem>
                                )}
                                {canSendReminder && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send Reminder
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
            enableSorting: false,
        },
    ];

    const organizationColumns = [
        {
            accessorKey: 'organization_name',
            header: 'Organization',
            cell: ({ row }: any) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => setSelectedOrganization(row.original)}
                >
                    {row.original.organization_name}
                </Button>
            ),
        },
        {
            accessorKey: 'billing_status',
            header: 'Billing Status',
            cell: ({ row }: any) => {
                const status = row.original.billing_status || 'inactive';
                return (
                    <Badge variant={status === 'active' ? 'success' : 'secondary'}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'billing_cycle',
            header: 'Billing Cycle',
            cell: ({ row }: any) => row.original.billing_cycle || 'Not set',
        },
        {
            accessorKey: 'seat_limit',
            header: 'Seat Limit',
            cell: ({ row }: any) => row.original.seat_limit || 'Unlimited',
        },
        {
            accessorKey: 'credit_limit',
            header: 'Credit Limit',
            cell: ({ row }: any) => row.original.credit_limit ? formatCurrency(row.original.credit_limit) : 'Not set',
        },
        {
            accessorKey: 'subscription_start_date',
            header: 'Subscription Start',
            cell: ({ row }: any) =>
                row.original.subscription_start_date
                    ? formatDate(row.original.subscription_start_date)
                    : 'Not started',
        },
        {
            accessorKey: 'next_billing_date',
            header: 'Next Billing',
            cell: ({ row }: any) =>
                row.original.next_billing_date
                    ? formatDate(row.original.next_billing_date)
                    : 'Not scheduled',
        },
    ];

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading billing data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage subscription invoices, payments, and billing overview
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button
                        onClick={() => setShowCreateInvoiceModal(true)}
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {summary && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(summary.total_paid)}
                        icon={DollarSign}
                        iconBg="bg-green-50"
                        iconColor="text-green-600"
                    />
                    <StatCard
                        title="Outstanding"
                        value={formatCurrency(summary.total_outstanding)}
                        icon={CreditCard}
                        iconBg="bg-red-50"
                        iconColor="text-red-600"
                    />
                    <StatCard
                        title="Total Invoices"
                        value={summary.total_invoices}
                        icon={FileText}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        title="This Month"
                        value={formatCurrency(summary.current_month_revenue)}
                        icon={Calendar}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                    />
                </div>
            )}

            {/* Main Content */}
            <Card className="border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Billing Overview</CardTitle>
                        <div className="flex items-center gap-2">
                            <SearchInput
                                placeholder="Search organizations..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="w-64"
                            />
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">7 days</SelectItem>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                    <SelectItem value="365">1 year</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                                <TabsTrigger value="organizations">Organizations</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-2">
                                {activeTab === 'invoices' ? (
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="sent">Sent</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Select value={tierFilter} onValueChange={setTierFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Tiers</SelectItem>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <TabsContent value="invoices">
                            <DataTable
                                columns={invoiceColumns}
                                data={invoices}
                            />
                        </TabsContent>

                        <TabsContent value="organizations">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-muted-foreground">Loading organizations...</div>
                                </div>
                            ) : organizationBilling.length === 0 ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-muted-foreground">No organizations found</div>
                                </div>
                            ) : (
                                <DataTable
                                    columns={organizationColumns}
                                    data={organizationBilling}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Modals */}
            {showCreateInvoiceModal && (
                <CreateInvoiceModal
                    isOpen={showCreateInvoiceModal}
                    onClose={() => setShowCreateInvoiceModal(false)}
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

            {selectedOrganization && (
                <OrganizationBillingModal
                    organization={selectedOrganization}
                    isOpen={!!selectedOrganization}
                    onClose={() => setSelectedOrganization(null)}
                    onRefresh={loadData}
                />
            )}
        </div>
    );
}