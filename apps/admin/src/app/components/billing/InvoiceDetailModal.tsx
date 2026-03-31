import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Button,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Separator,
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Label,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import {
    Eye,
    Send,
    CheckCircle,
    CreditCard,
    FileText,
    Calendar,
    DollarSign,
} from 'lucide-react';

import type { Invoice } from '../../types/billing.types';

const paymentSchema = z.object({
    payment_date: z.string().min(1, 'Payment date is required'),
    payment_method: z.string().min(1, 'Payment method is required'),
    transaction_id: z.string().optional(),
    notes: z.string().optional(),
});

const createPaymentSchema = z.object({
    payment_amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
    payment_method: z.string().min(1, 'Payment method is required'),
    payment_date: z.string().min(1, 'Payment date is required'),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;
type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

interface InvoiceDetailModalProps {
    invoice: Invoice;
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string, invoiceId: string, data?: any) => Promise<void>;
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
        month: 'long',
        day: 'numeric',
    });
}

function getStatusBadge(status: string) {
    const statusConfig = {
        paid: { variant: 'success' as const, label: 'Paid', icon: CheckCircle },
        pending: { variant: 'warning' as const, label: 'Pending', icon: Calendar },
        overdue: { variant: 'destructive' as const, label: 'Overdue', icon: Calendar },
        sent: { variant: 'secondary' as const, label: 'Sent', icon: Send },
        draft: { variant: 'secondary' as const, label: 'Draft', icon: FileText },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
        icon: FileText,
    };

    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
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

export function InvoiceDetailModal({ invoice, isOpen, onClose, onAction }: InvoiceDetailModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showCreatePaymentForm, setShowCreatePaymentForm] = useState(false);

    const paymentForm = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: '',
        },
    });

    const createPaymentForm = useForm<CreatePaymentFormData>({
        resolver: zodResolver(createPaymentSchema),
        defaultValues: {
            payment_amount: invoice.grand_total,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: '',
        },
    });

    const handleMarkAsSent = async () => {
        try {
            setLoading(true);
            await onAction('mark-sent', invoice.id);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (data: PaymentFormData) => {
        try {
            setLoading(true);
            await onAction('mark-paid', invoice.id, data);
            setShowPaymentForm(false);
            paymentForm.reset();
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePayment = async (data: CreatePaymentFormData) => {
        try {
            setLoading(true);
            await onAction('create-payment', invoice.id, data);
            setShowCreatePaymentForm(false);
            createPaymentForm.reset();
        } finally {
            setLoading(false);
        }
    };

    const paymentMethodOptions = [
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'check', label: 'Check' },
        { value: 'cash', label: 'Cash' },
        { value: 'other', label: 'Other' },
    ];

    const isOverdue = invoice.status === 'pending' && invoice.due_date && new Date(invoice.due_date) < new Date();
    const canMarkAsSent = invoice.status === 'draft';
    const canMarkAsPaid = ['sent', 'pending', 'overdue'].includes(invoice.status);
    const canCreatePayment = ['sent', 'pending', 'overdue'].includes(invoice.status);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            Invoice {invoice.invoice_no}
                            {getStatusBadge(invoice.status)}
                            {isOverdue && (
                                <Badge variant="destructive">Overdue</Badge>
                            )}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {canMarkAsSent && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAsSent}
                                    disabled={loading}
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                </Button>
                            )}
                            {canMarkAsPaid && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPaymentForm(true)}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                </Button>
                            )}
                            {canCreatePayment && (
                                <Button
                                    size="sm"
                                    onClick={() => setShowCreatePaymentForm(true)}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Create Payment
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="details">Invoice Details</TabsTrigger>
                        <TabsTrigger value="line-items">Line Items</TabsTrigger>
                        {(showPaymentForm || showCreatePaymentForm) && (
                            <TabsTrigger value="payment">Payment</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Invoice Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Invoice #</label>
                                            <p className="font-medium">{invoice.invoice_no}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                                            <p className="capitalize">{invoice.invoice_type.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Tier</label>
                                            <div className="mt-1">{getTierBadge(invoice.subscription_tier || 'basic')}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Financial Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Amount</label>
                                            <p className="text-2xl font-bold">{formatCurrency(invoice.grand_total)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                                            <p className={cn(
                                                'font-medium',
                                                isOverdue ? 'text-destructive' : 'text-foreground'
                                            )}>
                                                {invoice.due_date ? formatDate(invoice.due_date) : 'Not set'}
                                            </p>
                                        </div>
                                    </div>
                                    {invoice.paid_date && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Paid Date</label>
                                            <p className="font-medium text-success">{formatDate(invoice.paid_date)}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Billing Period */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Billing Period
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Period Start</label>
                                        <p className="font-medium">{invoice.subscription_period_start ? formatDate(invoice.subscription_period_start) : 'Not set'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Period End</label>
                                        <p className="font-medium">{invoice.subscription_period_end ? formatDate(invoice.subscription_period_end) : 'Not set'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {invoice.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{invoice.description}</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="line-items">
                        {invoice.line_items && invoice.line_items.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Line Items</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="space-y-0">
                                        {invoice.line_items.map((item, index) => (
                                            <div key={item.id || index} className={cn(
                                                "p-4 grid grid-cols-12 gap-4 items-center",
                                                index !== invoice.line_items!.length - 1 && "border-b"
                                            )}>
                                                <div className="col-span-6">
                                                    <p className="font-medium">{item.description}</p>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <p className="text-muted-foreground">{item.quantity}</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="text-muted-foreground">{formatCurrency(item.unit_price)}</p>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <p className="font-medium">{formatCurrency(item.total_amount)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t bg-muted/50">
                                        <div className="flex justify-end">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                                <p className="text-xl font-bold">{formatCurrency(invoice.grand_total)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No line items specified for this invoice.
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {showPaymentForm && (
                        <TabsContent value="payment">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mark Invoice as Paid</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={paymentForm.handleSubmit(handleMarkAsPaid)} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="payment_date">Payment Date *</Label>
                                                <Input
                                                    id="payment_date"
                                                    type="date"
                                                    {...paymentForm.register('payment_date')}
                                                />
                                                {paymentForm.formState.errors.payment_date && (
                                                    <p className="text-sm text-red-500 mt-1">{paymentForm.formState.errors.payment_date.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="payment_method">Payment Method *</Label>
                                                <Select
                                                    {...paymentForm.register('payment_method')}
                                                    onValueChange={(value) => paymentForm.setValue('payment_method', value)}
                                                    value={paymentForm.watch('payment_method')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {paymentMethodOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {paymentForm.formState.errors.payment_method && (
                                                    <p className="text-sm text-red-500 mt-1">{paymentForm.formState.errors.payment_method.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="transaction_id">Transaction ID</Label>
                                            <Input
                                                id="transaction_id"
                                                placeholder="Transaction or reference ID"
                                                {...paymentForm.register('transaction_id')}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                placeholder="Payment notes..."
                                                {...paymentForm.register('notes')}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={loading}>
                                                {loading ? 'Updating...' : 'Mark as Paid'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {showCreatePaymentForm && (
                        <TabsContent value="payment">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Create Payment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={createPaymentForm.handleSubmit(handleCreatePayment)} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="payment_amount">Payment Amount ($) *</Label>
                                                <Input
                                                    id="payment_amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...createPaymentForm.register('payment_amount', {
                                                        valueAsNumber: true
                                                    })}
                                                />
                                                {createPaymentForm.formState.errors.payment_amount && (
                                                    <p className="text-sm text-red-500 mt-1">{createPaymentForm.formState.errors.payment_amount.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="create_payment_method">Payment Method *</Label>
                                                <Select
                                                    {...createPaymentForm.register('payment_method')}
                                                    onValueChange={(value) => createPaymentForm.setValue('payment_method', value)}
                                                    value={createPaymentForm.watch('payment_method')}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {paymentMethodOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {createPaymentForm.formState.errors.payment_method && (
                                                    <p className="text-sm text-red-500 mt-1">{createPaymentForm.formState.errors.payment_method.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="create_payment_date">Payment Date *</Label>
                                            <Input
                                                id="create_payment_date"
                                                type="date"
                                                {...createPaymentForm.register('payment_date')}
                                            />
                                            {createPaymentForm.formState.errors.payment_date && (
                                                <p className="text-sm text-red-500 mt-1">{createPaymentForm.formState.errors.payment_date.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="create_notes">Notes</Label>
                                            <Textarea
                                                id="create_notes"
                                                placeholder="Payment notes..."
                                                {...createPaymentForm.register('notes')}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button type="button" variant="outline" onClick={() => setShowCreatePaymentForm(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={loading}>
                                                {loading ? 'Creating...' : 'Create Payment'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}